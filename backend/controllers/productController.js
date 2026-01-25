
// backend/controllers/productController.js
const {
  Product,
  Category,
  ProductRating, // ✅ REQUIRED
  ProductImage,
  ProductFeature,
  ProductSize,
  ShippingRule,
} = require("../models");

/* ===============================
   HELPERS
================================ */
// ===============================
// 🔔 PRODUCT UPDATE NOTIFIER (SSE)
// ===============================
const productSubscribers = new Set();

function notifyProductUpdate() {
  for (const res of productSubscribers) {
    try {
      res.write(`event: product-update\ndata: update\n\n`);
    } catch (_) {}
  }
}

// 🔌 SSE endpoint
function subscribeProductUpdates(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  productSubscribers.add(res);

  req.on("close", () => {
    productSubscribers.delete(res);
  });
}

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

/**
 * ✅ BUSINESS RULES (Best Practice)
 *
 * - old_price is ONLY allowed when tag === "exclusive-offer"
 * - For exclusive offer:
 *     old_price is REQUIRED and must be > price
 *     exclusive_offer_end is REQUIRED and must be a valid future date (recommended)
 * - If tag is changed away from "exclusive-offer":
 *     auto-clear old_price + exclusive_offer_end
 *
 * This prevents "sometimes works" UI.
 */
function validateAndNormalizeOfferFields({ tag, price, old_price, exclusive_offer_end }) {
  const normalizedTag = normalizeTag(tag);

  // parse date if present (support string)
  let offerEnd = exclusive_offer_end;
  if (offerEnd !== undefined && offerEnd !== null && offerEnd !== "") {
    const d = new Date(offerEnd);
    // invalid date -> null (and error if required)
    offerEnd = Number.isNaN(d.getTime()) ? null : d;
  } else {
    offerEnd = null;
  }

  const p = price; // already parsed number upstream
  const op = old_price; // already parsed upstream (number or null)

  // Case A: Exclusive Offer tag
  if (normalizedTag === "exclusive-offer") {
    // old_price must exist
    if (op === null) {
      return {
        ok: false,
        message: "Old price is required when tag is Exclusive Offer.",
      };
    }
    // old_price must be > price
    if (p !== null && op !== null && op <= p) {
      return {
        ok: false,
        message: "Old price must be greater than price for Exclusive Offer.",
      };
    }
    // exclusive_offer_end should exist for exclusive offers
    if (!offerEnd) {
      return {
        ok: false,
        message: "Exclusive offer end date is required for Exclusive Offer.",
      };
    }

    // (Optional) enforce future date
    // if (offerEnd.getTime() <= Date.now()) {
    //   return { ok: false, message: "Exclusive offer end date must be in the future." };
    // }

    return {
      ok: true,
      normalizedTag,
      normalizedOldPrice: op,
      normalizedOfferEnd: offerEnd,
    };
  }

  // Case B: Non-exclusive tag
  // old_price should NOT be kept
  // exclusive_offer_end should NOT be kept
  return {
    ok: true,
    normalizedTag: normalizedTag || null,
    normalizedOldPrice: null,
    normalizedOfferEnd: null,
  };
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
      old_price: p.old_price, // ✅ include for admin table if needed
      tag: p.tag,
      exclusive_offer_end: p.exclusive_offer_end,
      stock: p.stock ?? 0,
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
          ? new Date(rawProduct.exclusive_offer_end).toISOString().slice(0, 16)
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
   ADD PRODUCT
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

    const slugFromBody = req.body.categorySlug || req.body.slug || req.body.category || null;

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
      req.body.description_short ?? req.body.descriptionShort ?? req.body.descriptionTitle ?? null;

    const descriptionLong =
      req.body.description_long ??
      req.body.descriptionLong ??
      req.body.descriptionLongSummary ??
      null;

    const incomingTag = req.body.tag;
    const incomingOldPrice = toNumberOrNull(req.body.old_price ?? req.body.oldPrice);
    const stock = toIntOrDefault(req.body.stock, 0);

    const incomingOfferEnd =
      req.body.exclusive_offer_end ??
      req.body.exclusiveOfferEnd ??
      req.body.exclusiveOfferEndsAt ??
      null;

    // ✅ Apply offer business rules here (throws real error message)
    const offerCheck = validateAndNormalizeOfferFields({
      tag: incomingTag,
      price,
      old_price: incomingOldPrice,
      exclusive_offer_end: incomingOfferEnd,
    });

    if (!offerCheck.ok) {
      return res.status(400).json({
        success: false,
        message: offerCheck.message,
      });
    }

    // ✅ Create product
    const product = await Product.create({
      name,
      price,
      category_id: categoryId,
      tag: offerCheck.normalizedTag,
      old_price: offerCheck.normalizedOldPrice,
      stock,
      description_short: descriptionShort || null,
      description_long: descriptionLong || null,
      exclusive_offer_end: offerCheck.normalizedOfferEnd,
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
        shipping.courier_charge ??
        shipping.courierCharge ??
        shipping.home_delivery_charge ??
        shipping.homeDeliveryCharge ??
        shipping.outside_valley_charge ??
        shipping.outsideValleyCharge ??
        shipping.courier_desc ??
        shipping.courierDesc ??
        shipping.home_delivery_desc ??
        shipping.homeDeliveryDesc ??
        shipping.outside_valley_desc ??
        shipping.outsideValleyDesc;

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

   // 🔔 Notify all user pages to refetch products
notifyProductUpdate();

    return res.status(201).json({
      success: true,
      productId: product.id,
      // ✅ helpful for frontend to update without reload
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        old_price: product.old_price,
        tag: product.tag,
        exclusive_offer_end: product.exclusive_offer_end,
      },
    });
  } catch (err) {
    console.error("Error in addProduct:", err);
    return res.status(500).json({ success: false, message: "Failed to create product" });
  }
}

/* ============================================================
   UPDATE PRODUCT (Admin)
   - old_price only allowed when tag is exclusive-offer
   - if tag changes away from exclusive-offer -> auto clear old_price + end date
   - if exclusive_offer_end has passed and admin changes tag -> clears fields
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

    const payload = {};

    // name (optional)
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

    // price (optional)
    let incomingPrice = undefined;
    if (req.body.price !== undefined) {
      const p = toNumberOrNull(req.body.price);
      if (p === null) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number",
        });
      }
      payload.price = p;
      incomingPrice = p;
    }

    // stock (optional)
    if (req.body.stock !== undefined) {
      payload.stock = toIntOrDefault(req.body.stock, 0);
    }

    // descriptions (optional)
    if (
      req.body.description_short !== undefined ||
      req.body.descriptionShort !== undefined ||
      req.body.descriptionTitle !== undefined
    ) {
      const v =
        req.body.description_short ?? req.body.descriptionShort ?? req.body.descriptionTitle;
      payload.description_short = v && String(v).trim() !== "" ? v : null;
    }

    if (
      req.body.description_long !== undefined ||
      req.body.descriptionLong !== undefined ||
      req.body.descriptionLongSummary !== undefined
    ) {
      const v =
        req.body.description_long ?? req.body.descriptionLong ?? req.body.descriptionLongSummary;
      payload.description_long = v && String(v).trim() !== "" ? v : null;
    }

    // category (optional)
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

    /**
     * ✅ Offer fields (IMPORTANT)
     * We need to decide rules based on the "final tag" after update.
     */
    const incomingTag = req.body.tag !== undefined ? req.body.tag : product.tag;
    const normalizedIncomingTag = normalizeTag(incomingTag) || null;

    // Parse old_price ONLY if admin typed something (do not wipe accidentally)
    let incomingOldPrice = undefined;
    if (req.body.old_price !== undefined && String(req.body.old_price).trim() !== "") {
      incomingOldPrice = toNumberOrNull(req.body.old_price);
    } else if (req.body.oldPrice !== undefined && String(req.body.oldPrice).trim() !== "") {
      incomingOldPrice = toNumberOrNull(req.body.oldPrice);
    }

    // Offer end date (optional) — only if provided
    let incomingOfferEnd = undefined;
    if (
      req.body.exclusive_offer_end !== undefined ||
      req.body.exclusiveOfferEnd !== undefined ||
      req.body.exclusiveOfferEndsAt !== undefined
    ) {
      const raw =
        req.body.exclusive_offer_end ?? req.body.exclusiveOfferEnd ?? req.body.exclusiveOfferEndsAt;
      incomingOfferEnd = raw && String(raw).trim() !== "" ? raw : null;
    }

    // Determine final price for validation
    const finalPrice = incomingPrice !== undefined ? incomingPrice : product.price;

    // Determine final old_price for validation
    const finalOldPrice =
      incomingOldPrice !== undefined ? incomingOldPrice : product.old_price;

    // Determine final offer end for validation
    const finalOfferEnd =
      incomingOfferEnd !== undefined ? incomingOfferEnd : product.exclusive_offer_end;

    // Validate and normalize based on FINAL tag
    const offerCheck = validateAndNormalizeOfferFields({
      tag: normalizedIncomingTag,
      price: finalPrice,
      old_price: finalOldPrice === undefined ? null : finalOldPrice,
      exclusive_offer_end: finalOfferEnd,
    });

    if (!offerCheck.ok) {
      return res.status(400).json({
        success: false,
        message: offerCheck.message,
      });
    }

    // Apply tag always if provided
    if (req.body.tag !== undefined) {
      payload.tag = offerCheck.normalizedTag;
    } else {
      // even if tag wasn't provided, normalize might clear invalid old price if tag isn't exclusive
      payload.tag = offerCheck.normalizedTag;
    }

   
    payload.old_price = offerCheck.normalizedOldPrice;
    payload.exclusive_offer_end = offerCheck.normalizedOfferEnd;

    // ✅ Apply payload updates
    if (Object.keys(payload).length > 0) {
      await product.update(payload);
    }

    /* ===============================
       2) Images (robust)
    =============================== */
    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);

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

    if (req.body.existingImages !== undefined || uploadedImages.length > 0) {
      await ProductImage.destroy({ where: { product_id: id } });

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
    =============================== */
    if (req.body.features !== undefined) {
      const features = safeJsonParse(req.body.features, []);
      await ProductFeature.destroy({ where: { product_id: id } });

      const cleaned = (features || []).map((f) => String(f || "").trim()).filter(Boolean);

      if (cleaned.length) {
        await ProductFeature.bulkCreate(
          cleaned.map((t) => ({ product_id: id, feature_text: t }))
        );
      }
    }

    /* ===============================
       4) Sizes (optional)
    =============================== */
    if (req.body.sizes !== undefined) {
      const sizes = safeJsonParse(req.body.sizes, []);
      await ProductSize.destroy({ where: { product_id: id } });

      const cleaned = (sizes || []).map((s) => String(s || "").trim()).filter(Boolean);

      if (cleaned.length) {
        await ProductSize.bulkCreate(
          cleaned.map((t) => ({ product_id: id, size_text: t }))
        );
      }
    }

    /* ===============================
       5) Shipping (optional)
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
    // 🔔 Notify all user pages to refetch products
notifyProductUpdate();

    return res.json({
      success: true,
      message: "Product updated successfully",
      // ✅ return new values for instant UI updates in admin
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        old_price: product.old_price,
        tag: product.tag,
        exclusive_offer_end: product.exclusive_offer_end,
      },
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
   DELETE PRODUCT
============================================================ */
async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await ProductImage.destroy({ where: { product_id: id } });
    await ProductFeature.destroy({ where: { product_id: id } });
    await ProductSize.destroy({ where: { product_id: id } });
    await ShippingRule.destroy({ where: { product_id: id } });
    await ProductRating.destroy({ where: { product_id: id } });

    await Product.destroy({ where: { id } });
    
    // 🔔 Notify all user pages to refetch products
    notifyProductUpdate();

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("❌ deleteProduct ERROR:", err);
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
  subscribeProductUpdates,
};
