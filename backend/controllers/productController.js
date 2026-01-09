// backend/controllers/productController.js
const {
  Product,
  Category,
  ProductImage,
  ProductFeature,
  ProductSize,
  ShippingRule,
} = require("../models");

/* ===============================
   HELPERS
================================ */

// Safe JSON parse (never crashes)
function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Normalize tag coming from frontend (handles "Exclusive Offer" vs "exclusive-offer")
function normalizeTag(tag) {
  if (!tag) return null;

  const t = String(tag).trim().toLowerCase();

  // common UI labels → DB tags
  if (t === "exclusive offer" || t === "exclusive-offer") return "exclusive-offer";
  if (t === "best selling" || t === "best-selling") return "best-selling";
  if (t === "new arrival" || t === "new-arrival") return "new-arrival";
  if (t === "accessories") return "accessories";

  // if frontend already sends correct tag
  return tag;
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIntOrDefault(v, def = 0) {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

/* ============================================================
   GET CATEGORY BY SLUG
============================================================ */
async function getCategoryBySlug(req, res) {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      where: { slug },
      attributes: ["id", "name", "slug"],
    });

    if (!category) return res.status(404).json({ message: "Category not found" });

    return res.json(category);
  } catch (err) {
    console.error("Error in getCategoryBySlug:", err);
    return res.status(500).json({ message: "Failed to load category" });
  }
}

/* ============================================================
   GET PRODUCTS BY CATEGORY (ADMIN)
============================================================ */
async function getProductsByCategory(req, res) {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const products = await Product.findAll({
      where: { category_id: categoryId },
      include: [{ model: ProductImage, attributes: ["image_url"] }],
      order: [["id", "DESC"]],
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      tag: p.tag,
      images: (p.ProductImages || []).map((i) =>
        String(i.image_url || "")
          .replace(/\\/g, "/")
          .startsWith("/uploads")
          ? String(i.image_url).replace(/\\/g, "/")
          : `/uploads/${String(i.image_url || "").replace(/\\/g, "/")}`
      ),
    }));

    return res.json({ success: true, products: formatted });
  } catch (err) {
    console.error("Error in getProductsByCategory:", err);
    return res.status(500).json({ message: "Failed to load products" });
  }
}

/* ============================================================
   GET PRODUCT BY ID (ADMIN EDIT)
============================================================ */
async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ["slug"] },
        { model: ProductImage, attributes: ["image_url"] },
        { model: ProductFeature, attributes: ["feature_text"] },
        { model: ProductSize, attributes: ["size_text"] },
        { model: ShippingRule },
      ],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

       const rawProduct = product.toJSON();

return res.json({
  success: true,
  product: {
    ...rawProduct,

    // ✅ FIX: format datetime for edit form
    exclusive_offer_end: rawProduct.exclusive_offer_end
      ? new Date(rawProduct.exclusive_offer_end)
          .toISOString()
          .slice(0, 16)
      : null,

    categorySlug: product.Category?.slug || null,

    images: (product.ProductImages || []).map((i) =>
      String(i.image_url || "").replace(/\\/g, "/").startsWith("/uploads")
        ? String(i.image_url || "").replace(/\\/g, "/")
        : `/uploads/${String(i.image_url || "").replace(/\\/g, "/")}`
    ),

    features: (product.ProductFeatures || []).map((f) => f.feature_text),
    sizes: (product.ProductSizes || []).map((s) => s.size_text),
    shipping: product.ShippingRule || null,
  },
});

  } catch (err) {
    console.error("Error in getProductById:", err);
    return res.status(500).json({ success: false, message: "Failed to load product" });
  }
}

/* ============================================================
   ADD PRODUCT  ✅ ONLY NAME + PRICE REQUIRED
   (Everything else optional, no frontend changes)
============================================================ */
async function addProduct(req, res) {
  try {
    // ✅ Require only name + price
    const name = (req.body.name || "").trim();
    const price = toNumberOrNull(req.body.price);

    if (!name || price === null) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required",
      });
    }

    // ✅ Images optional
    const imagePaths = (req.files || []).map((file) => `/uploads/${file.filename}`);

    // ✅ Optional arrays/objects (never crash)
    const features = safeJsonParse(req.body.features, []);
    const sizes = safeJsonParse(req.body.sizes, []);
    const shipping = safeJsonParse(req.body.shipping, null);

    // ✅ Category: accept category_id OR slug OR plain "category"
    let categoryId = Number(req.body.category_id);

    const slugFromBody =
      req.body.categorySlug || req.body.slug || req.body.category || null;

    if (!categoryId && slugFromBody) {
      const category = await Category.findOne({ where: { slug: slugFromBody } });
      if (!category) {
        return res.status(400).json({ success: false, message: "Invalid category slug" });
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required (category_id or categorySlug)",
      });
    }

    // ✅ Map possible frontend keys → DB columns (NO frontend change)
    const descriptionShort =
      req.body.description_short ??
      req.body.descriptionShort ??
      req.body.descriptionTitle ??
      null;

    const descriptionLong =
      req.body.description_long ??
      req.body.descriptionLong ??
      req.body.descriptionLongSummary ??
      null;

    const exclusiveOfferEnd =
      req.body.exclusive_offer_end ??
      req.body.exclusiveOfferEnd ??
      req.body.exclusiveOfferEndsAt ??
      null;

    // ✅ Normalize tag
    const tag = normalizeTag(req.body.tag);

    // ✅ Safe defaults
    const stock = toIntOrDefault(req.body.stock, 0);
    const old_price = toNumberOrNull(req.body.old_price ?? req.body.oldPrice);

    // ✅ Create product (only required fields enforced)
    const product = await Product.create({
      name,
      price,
      category_id: categoryId,
      tag: tag || null,
      old_price,
      stock,
      description_short: descriptionShort || null,
      description_long: descriptionLong || null,
      exclusive_offer_end: exclusiveOfferEnd || null,
    });

    // ✅ Images optional
    if (imagePaths.length) {
      await ProductImage.bulkCreate(
        imagePaths.map((img) => ({ product_id: product.id, image_url: img }))
      );
    }

    // ✅ Features optional
    if (Array.isArray(features) && features.length) {
      const cleaned = features.map((f) => String(f || "").trim()).filter(Boolean);
      if (cleaned.length) {
        await ProductFeature.bulkCreate(
          cleaned.map((t) => ({ product_id: product.id, feature_text: t }))
        );
      }
    }

    // ✅ Sizes optional
    if (Array.isArray(sizes) && sizes.length) {
      const cleaned = sizes.map((s) => String(s || "").trim()).filter(Boolean);
      if (cleaned.length) {
        await ProductSize.bulkCreate(
          cleaned.map((t) => ({ product_id: product.id, size_text: t }))
        );
      }
    }

    // ✅ Shipping optional (only insert if at least one field exists)
    if (shipping && typeof shipping === "object") {
      const hasAny =
        shipping.courier_charge ?? shipping.courierCharge ??
        shipping.home_delivery_charge ?? shipping.homeDeliveryCharge ??
        shipping.outside_valley_charge ?? shipping.outsideValleyCharge ??
        shipping.courier_desc ?? shipping.courierDesc ??
        shipping.home_delivery_desc ?? shipping.homeDeliveryDesc ??
        shipping.outside_valley_desc ?? shipping.outsideValleyDesc;

      if (hasAny !== undefined) {
        await ShippingRule.create({
          product_id: product.id,
          courier_charge: toNumberOrNull(shipping.courier_charge ?? shipping.courierCharge),
          courier_desc: shipping.courier_desc ?? shipping.courierDesc ?? null,
          home_delivery_charge: toNumberOrNull(
            shipping.home_delivery_charge ?? shipping.homeDeliveryCharge
          ),
          home_delivery_desc: shipping.home_delivery_desc ?? shipping.homeDeliveryDesc ?? null,
          outside_valley_charge: toNumberOrNull(
            shipping.outside_valley_charge ?? shipping.outsideValleyCharge
          ),
          outside_valley_desc: shipping.outside_valley_desc ?? shipping.outsideValleyDesc ?? null,
        });
      }
    }

    return res.status(201).json({ success: true, productId: product.id });
  } catch (err) {
    console.error("Error in addProduct:", err);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
}

/* ============================================================
   UPDATE PRODUCT  ✅ partial update, optional fields safe
============================================================ */
/* ============================================================
   UPDATE PRODUCT ✅ FULL FIXED (robust, admin can update everything)
============================================================ */
async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);

    const product = await Product.findByPk(id, {
      include: [ProductImage, ProductFeature, ProductSize, ShippingRule],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* ===============================
       1) Build payload (only update provided fields)
    =============================== */
    const payload = {};

    // name + price should not be saved as empty/invalid
    if (req.body.name !== undefined) {
      const n = String(req.body.name).trim();
      if (!n) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }
      payload.name = n;
    }

    if (req.body.price !== undefined) {
      const p = toNumberOrNull(req.body.price);
      if (p === null) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number",
        });
      }
      payload.price = p;
    }

    // optional numeric fields
    if (req.body.old_price !== undefined || req.body.oldPrice !== undefined) {
      payload.old_price = toNumberOrNull(req.body.old_price ?? req.body.oldPrice);
    }

    if (req.body.stock !== undefined) {
      payload.stock = toIntOrDefault(req.body.stock, 0);
    }

    // tag (optional)
    if (req.body.tag !== undefined) {
      payload.tag = normalizeTag(req.body.tag) || null;
    }

    // ✅ Category update (optional) — supports id or slug
    if (req.body.category_id !== undefined && req.body.category_id !== "") {
      payload.category_id = Number(req.body.category_id);
    } else if (req.body.categorySlug !== undefined && req.body.categorySlug !== "") {
      const cat = await Category.findOne({ where: { slug: req.body.categorySlug } });
      if (!cat) {
        return res.status(400).json({
          success: false,
          message: "Invalid category slug",
        });
      }
      payload.category_id = cat.id;
    }

    // descriptions (accept multiple frontend keys)
    if (
      req.body.description_short !== undefined ||
      req.body.descriptionShort !== undefined ||
      req.body.descriptionTitle !== undefined
    ) {
      const v =
        req.body.description_short ??
        req.body.descriptionShort ??
        req.body.descriptionTitle;

      payload.description_short = v && String(v).trim() !== "" ? v : null;
    }

    if (
      req.body.description_long !== undefined ||
      req.body.descriptionLong !== undefined ||
      req.body.descriptionLongSummary !== undefined
    ) {
      const v =
        req.body.description_long ??
        req.body.descriptionLong ??
        req.body.descriptionLongSummary;

      payload.description_long = v && String(v).trim() !== "" ? v : null;
    }

    // ✅ Exclusive offer end date (must be Date or null; never "")
    if (
      req.body.exclusive_offer_end !== undefined ||
      req.body.exclusiveOfferEnd !== undefined ||
      req.body.exclusiveOfferEndsAt !== undefined
    ) {
      const raw =
        req.body.exclusive_offer_end ??
        req.body.exclusiveOfferEnd ??
        req.body.exclusiveOfferEndsAt;

      payload.exclusive_offer_end =
        raw && String(raw).trim() !== "" ? new Date(raw) : null;
    }

    // ✅ Apply payload updates
    if (Object.keys(payload).length > 0) {
      await product.update(payload);
    }

    /* ===============================
       2) Images (robust)
       - supports existingImages as JSON string OR array
       - supports adding new uploaded images
       - supports deleting ALL images
    =============================== */
    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/${file.filename}`
    );

    let existingImages = [];
    if (req.body.existingImages !== undefined) {
      if (Array.isArray(req.body.existingImages)) {
        existingImages = req.body.existingImages;
      } else {
        existingImages = safeJsonParse(req.body.existingImages, []);
      }
    }

    const finalImages = [...existingImages, ...uploadedImages]
      .map((i) => String(i || "").trim())
      .filter(Boolean)
      .map((i) => i.replace(/\\/g, "/"));

    // If admin touched images OR uploaded new ones, apply replace
    if (req.body.existingImages !== undefined || uploadedImages.length > 0) {
      await ProductImage.destroy({ where: { product_id: id } });

      // allow empty = delete all images
      if (finalImages.length > 0) {
        await ProductImage.bulkCreate(
          finalImages.map((img) => ({
            product_id: id,
            image_url: img,
          }))
        );
      }
    }

    /* ===============================
       3) Features (optional)
       - only updates if frontend sends "features"
    =============================== */
    if (req.body.features !== undefined) {
      const features = safeJsonParse(req.body.features, []);
      await ProductFeature.destroy({ where: { product_id: id } });

      const cleaned = (features || [])
        .map((f) => String(f || "").trim())
        .filter(Boolean);

      if (cleaned.length) {
        await ProductFeature.bulkCreate(
          cleaned.map((t) => ({ product_id: id, feature_text: t }))
        );
      }
    }

    /* ===============================
       4) Sizes (optional)
       - only updates if frontend sends "sizes"
    =============================== */
    if (req.body.sizes !== undefined) {
      const sizes = safeJsonParse(req.body.sizes, []);
      await ProductSize.destroy({ where: { product_id: id } });

      const cleaned = (sizes || [])
        .map((s) => String(s || "").trim())
        .filter(Boolean);

      if (cleaned.length) {
        await ProductSize.bulkCreate(
          cleaned.map((t) => ({ product_id: id, size_text: t }))
        );
      }
    }

    /* ===============================
       5) Shipping (optional)
       - only updates if frontend sends "shipping"
       - safe if shipping is empty/null
    =============================== */
    if (req.body.shipping !== undefined) {
      const shipping = safeJsonParse(req.body.shipping, null);

      await ShippingRule.destroy({ where: { product_id: id } });

      if (shipping && typeof shipping === "object") {
        await ShippingRule.create({
          product_id: id,
          courier_charge: toNumberOrNull(shipping.courier_charge ?? shipping.courierCharge),
          courier_desc: shipping.courier_desc ?? shipping.courierDesc ?? null,
          home_delivery_charge: toNumberOrNull(
            shipping.home_delivery_charge ?? shipping.homeDeliveryCharge
          ),
          home_delivery_desc: shipping.home_delivery_desc ?? shipping.homeDeliveryDesc ?? null,
          outside_valley_charge: toNumberOrNull(
            shipping.outside_valley_charge ?? shipping.outsideValleyCharge
          ),
          outside_valley_desc: shipping.outside_valley_desc ?? shipping.outsideValleyDesc ?? null,
        });
      }
    }

    return res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error("updateProduct ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

/* ============================================================
   DELETE PRODUCT ✅ FULL FIXED
   (deletes product + related tables)
============================================================ */
async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    // remove dependent rows first (avoids FK issues)
    await ProductImage.destroy({ where: { product_id: id } });
    await ProductFeature.destroy({ where: { product_id: id } });
    await ProductSize.destroy({ where: { product_id: id } });
    await ShippingRule.destroy({ where: { product_id: id } });
    await ProductRating?.destroy?.({ where: { product_id: id } }); // safe if not imported

    const deleted = await Product.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteProduct:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
}


/* ============================================================
   EXPORTS
============================================================ */
module.exports = {
  addProduct,
  getProductsByCategory,
  getCategoryBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
};
