const { pool } = require("../database/db");

/* ============================================================
   GET LATEST PRODUCTS FOR HOMEPAGE (Men Latest, Women Latest…)
============================================================ */
exports.getLatestProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = Number(req.query.limit) || 6;

    // 1️⃣ Check category from slug
    const category = await pool.query(
      "SELECT id FROM categories WHERE slug = $1",
      [slug]
    );

    if (category.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const categoryId = category.rows[0].id;

    // 2️⃣ Fetch latest products + FIRST image + rating avg + rating count
    const result = await pool.query(
      `
      SELECT 
        p.*,

        /* ⭐ FIRST MAIN IMAGE */
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = p.id 
          ORDER BY id ASC 
          LIMIT 1
        ) AS main_image,

        /* ⭐ AVERAGE RATING */
        COALESCE(AVG(r.rating), 0) AS avg_rating,

        /* ⭐ TOTAL RATING COUNT */
        COUNT(r.rating) AS rating_count

      FROM products p
      LEFT JOIN product_ratings r 
        ON p.id = r.product_id

      WHERE p.category_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2
      `,
      [categoryId, limit]
    );

    return res.json({
      success: true,
      products: result.rows,
    });

  } catch (err) {
    console.error("❌ getLatestProducts ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load latest products",
    });
  }
};

/* ============================================================
   GET ALL PRODUCTS BY CATEGORY SLUG
============================================================ */
exports.getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1️⃣ Validate category slug
    const category = await pool.query(
      "SELECT id FROM categories WHERE slug = $1",
      [slug]
    );

    if (category.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const categoryId = category.rows[0].id;

    // 2️⃣ Fetch all products + rating joins
    const result = await pool.query(
      `
      SELECT 
        p.*,

        /* ⭐ FIRST IMAGE */
        (
          SELECT image_url
          FROM product_images
          WHERE product_id = p.id
          ORDER BY id ASC
          LIMIT 1
        ) AS main_image,

        /* ⭐ AVERAGE RATING */
        COALESCE(AVG(r.rating), 0) AS avg_rating,

        /* ⭐ TOTAL RATING COUNT */
        COUNT(r.rating) AS rating_count

      FROM products p
      LEFT JOIN product_ratings r 
        ON p.id = r.product_id

      WHERE p.category_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      `,
      [categoryId]
    );

    return res.json({
      success: true,
      products: result.rows,
    });

  } catch (err) {
    console.error("❌ getProductsByCategorySlug ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load category products",
    });
  }
};

/* ============================================================
   GET SINGLE PRODUCT DETAILS PAGE
============================================================ */
exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        p.*,

        /* ⭐ ALL IMAGES ARRAY */
        (
          SELECT json_agg(image_url)
          FROM product_images
          WHERE product_id = p.id
        ) AS images,

        /* ⭐ AVERAGE RATING */
        COALESCE(AVG(r.rating), 0) AS avg_rating,

        /* ⭐ TOTAL RATINGS */
        COUNT(r.rating) AS rating_count

      FROM products p
      LEFT JOIN product_ratings r
        ON p.id = r.product_id

      WHERE p.id = $1
      GROUP BY p.id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product: result.rows[0],
    });

  } catch (err) {
    console.error("❌ getProductDetails ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load product details",
    });
  }
};
