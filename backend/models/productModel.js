// backend/models/productModel.js
const { pool } = require("../database/db");

/* ============================================================
   CREATE PRODUCT
============================================================ */
async function createProduct(data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      name,
      category_id,
      tag,
      price,
      oldPrice,
      stock,
      descriptionShort,
      descriptionLong,
      exclusiveOfferEnd,
      images,
      features,
      sizes,
      shipping,
    } = data;

    const prodRes = await client.query(
      `INSERT INTO products
        (name, category_id, tag, price, old_price, stock,
         description_short, description_long, exclusive_offer_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        name,
        category_id,
        tag || null,
        Number(price),
        oldPrice ? Number(oldPrice) : null,
        stock ? Number(stock) : 0,
        descriptionShort || null,
        descriptionLong || null,
        exclusiveOfferEnd || null,
      ]
    );

    const productId = prodRes.rows[0].id;

    // IMAGES
    if (Array.isArray(images)) {
      for (const url of images) {
        await client.query(
          "INSERT INTO product_images (product_id, image_url) VALUES ($1,$2)",
          [productId, url]
        );
      }
    }

    // FEATURES
    if (Array.isArray(features)) {
      for (const t of features) {
        if (t)
          await client.query(
            "INSERT INTO product_features (product_id, feature_text) VALUES ($1,$2)",
            [productId, t]
          );
      }
    }

    // SIZES
    if (Array.isArray(sizes)) {
      for (const s of sizes) {
        if (s)
          await client.query(
            "INSERT INTO product_sizes (product_id, size_text) VALUES ($1,$2)",
            [productId, s]
          );
      }
    }

    // SHIPPING
    if (shipping) {
      await client.query(
        `INSERT INTO shipping_rules
         (product_id, courier_charge, courier_desc,
          home_delivery_charge, home_delivery_desc,
          outside_valley_charge, outside_valley_desc)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          productId,
          shipping.courierCharge ? Number(shipping.courierCharge) : null,
          shipping.courierDesc || null,
          shipping.homeDeliveryCharge ? Number(shipping.homeDeliveryCharge) : null,
          shipping.homeDeliveryDesc || null,
          shipping.outsideValleyCharge ? Number(shipping.outsideValleyCharge) : null,
          shipping.outsideValleyDesc || null,
        ]
      );
    }

    await client.query("COMMIT");
    return productId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ============================================================
   GET PRODUCTS BY CATEGORY (FIXED FOR CLEAN IMAGES)
============================================================ */
async function getProductsByCategoryId(categoryId) {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.price,
      p.tag,
      json_agg(pi.image_url ORDER BY pi.id ASC) AS images
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.category_id = $1
    GROUP BY p.id
    ORDER BY p.id DESC;
    `,
    [categoryId]
  );

  // CLEAN IMAGE PATHS
  return result.rows.map((p) => {
    let imgs = Array.isArray(p.images) ? p.images : [];

    imgs = imgs
      .filter((i) => i) // remove null
      .map((i) => i.replace(/\\/g, "/")) // fix Windows path
      .map((i) => {
        if (i.startsWith("uploads")) return "/" + i;
        if (!i.startsWith("/uploads")) return "/uploads/" + i;
        return i;
      });

    return { ...p, images: imgs };
  });
}

/* ============================================================
   GET PRODUCT BY ID  (FULL CLEAN)
============================================================ */
async function getProductById(id) {
  const client = await pool.connect();
  try {
    const productRes = await client.query(
      `
      SELECT p.*, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (productRes.rowCount === 0) return null;

    const product = productRes.rows[0];

    const imgRes = await client.query(
      `SELECT image_url FROM product_images WHERE product_id=$1 ORDER BY id ASC`,
      [id]
    );

    let images = imgRes.rows.map((r) => r.image_url);

    images = images
      .filter((i) => i)
      .map((i) => i.replace(/\\/g, "/"))
      .map((i) => {
        if (i.startsWith("uploads")) return "/" + i;
        if (!i.startsWith("/uploads")) return "/uploads/" + i;
        return i;
      });

    const featRes = await client.query(
      `SELECT feature_text FROM product_features WHERE product_id=$1`,
      [id]
    );

    const sizeRes = await client.query(
      `SELECT size_text FROM product_sizes WHERE product_id=$1`,
      [id]
    );

    const shipRes = await client.query(
      `SELECT * FROM shipping_rules WHERE product_id=$1`,
      [id]
    );

    return {
      ...product,
      categorySlug: product.category_slug,
      images,
      features: featRes.rows.map((r) => r.feature_text),
      sizes: sizeRes.rows.map((r) => r.size_text),
      shipping: shipRes.rows[0] || null,
    };
  } finally {
    client.release();
  }
}

/* ============================================================
   UPDATE PRODUCT (NO MERGING — FINAL CLEAN LIST)
============================================================ */
async function updateProduct(id, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      name,
      price,
      oldPrice,
      stock,
      tag,
      descriptionShort,
      descriptionLong,
      exclusiveOfferEnd,
      images,
      features,
      sizes,
      shipping,
    } = data;

    await client.query(
      `UPDATE products SET
         name=$1, price=$2, old_price=$3, stock=$4, tag=$5,
         description_short=$6, description_long=$7,
         exclusive_offer_end=$8
       WHERE id=$9`,
      [
        name,
        Number(price),
        oldPrice ? Number(oldPrice) : null,
        stock ? Number(stock) : 0,
        tag || null,
        descriptionShort || null,
        descriptionLong || null,
        exclusiveOfferEnd || null,
        id,
      ]
    );

    // Replace all images
    await client.query("DELETE FROM product_images WHERE product_id=$1", [id]);

    if (Array.isArray(images)) {
      for (const url of images) {
        await client.query(
          "INSERT INTO product_images (product_id, image_url) VALUES ($1,$2)",
          [id, url]
        );
      }
    }

    // FEATURES
    await client.query("DELETE FROM product_features WHERE product_id=$1", [id]);
    for (const f of features || []) {
      if (f)
        await client.query(
          "INSERT INTO product_features (product_id, feature_text) VALUES ($1,$2)",
          [id, f]
        );
    }

    // SIZES
    await client.query("DELETE FROM product_sizes WHERE product_id=$1", [id]);
    for (const s of sizes || []) {
      if (s)
        await client.query(
          "INSERT INTO product_sizes (product_id, size_text) VALUES ($1,$2)",
          [id, s]
        );
    }

    // SHIPPING
    await client.query("DELETE FROM shipping_rules WHERE product_id=$1", [id]);
    if (shipping) {
      await client.query(
        `INSERT INTO shipping_rules
         (product_id, courier_charge, courier_desc,
          home_delivery_charge, home_delivery_desc,
          outside_valley_charge, outside_valley_desc)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          shipping.courierCharge ? Number(shipping.courierCharge) : null,
          shipping.courierDesc || null,
          shipping.homeDeliveryCharge ? Number(shipping.homeDeliveryCharge) : null,
          shipping.homeDeliveryDesc || null,
          shipping.outsideValleyCharge ? Number(shipping.outsideValleyCharge) : null,
          shipping.outsideValleyDesc || null,
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ============================================================
   DELETE PRODUCT
============================================================ */
async function deleteProduct(id) {
  const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  createProduct,
  getProductsByCategoryId,
  getProductById,
  updateProduct,
  deleteProduct,
};
