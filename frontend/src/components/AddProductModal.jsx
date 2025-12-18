import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./AddProductModal.css";

const TAG_OPTIONS = [
  { value: "best-selling", label: "Best Selling" },
  { value: "new-arrival", label: "New Arrival" },
  { value: "accessories", label: "Accessories" },
  { value: "exclusive-offer", label: "Exclusive Offer" },
];

const shippingFieldLabel = {
  courierCharge: "Courier Charge",
  homeDeliveryCharge: "Home Delivery",
  outsideValleyCharge: "Outside Valley",
};

// preset values per field (used to detect "custom")
const PRESET_SHIPPING_VALUES = {
  courierCharge: ["50", "70", "100", "120", "150"],
  homeDeliveryCharge: ["50", "70", "120", "150"],
  outsideValleyCharge: ["100", "120", "150"],
};

export default function AddProductModal({
  onClose,
  onSuccess,
  editId,
  categorySlug,
}) {
  /* ============================================================
        READ CATEGORY FROM URL (if needed)
  ============================================================ */
  const { slug } = useParams();
  const finalCategorySlug = categorySlug || slug;

  /* ============================================================
        STATE
  ============================================================ */
  const [categoryId, setCategoryId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: "",
    tag: "",
    descriptionShort: "",
    descriptionLong: "",
    sizes: [],
    features: [""],
    shipping: {
      courierCharge: "",
      courierDesc: "",
      homeDeliveryCharge: "",
      homeDeliveryDesc: "",
      outsideValleyCharge: "",
      outsideValleyDesc: "",
      customRules: [],
    },
    exclusiveOfferEnd: "",
  });

  // custom options like "Rs. 90 - hello"
  const [customShippingValues, setCustomShippingValues] = useState({
    courierCharge: [],
    homeDeliveryCharge: [],
    outsideValleyCharge: [],
  });

  // IMAGE STATE
  // existing images from backend: full URLs like http://localhost:5000/uploads/...
  const [serverImages, setServerImages] = useState([]);
  // newly added images (File objects)
  const [newImages, setNewImages] = useState([]);
  // previews for newly added images (object URLs)
  const [newPreviews, setNewPreviews] = useState([]);

  const fileInputRef = useRef(null);

  // custom amount popup
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customTargetField, setCustomTargetField] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ============================================================
        LOAD CATEGORY ID
  ============================================================ */
  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/categories/${finalCategorySlug}`
        );
        const data = await res.json();
        setCategoryId(data.id);
      } catch (err) {
        console.log("Category fetch failed", err);
      }
    }

    if (finalCategorySlug) fetchCategory();
  }, [finalCategorySlug]);

  /* ============================================================
        EDIT MODE — LOAD PRODUCT DATA
  ============================================================ */
  useEffect(() => {
    if (!editId) return;

    async function loadProduct() {
      try {
        setLoadingEdit(true);

        const res = await fetch(
          `http://localhost:5000/api/admin/products/${editId}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        const p = data.product;

        // --- RAW SHIPPING FROM BACKEND (snake_case from DB) ---
        const shippingRaw = p.shipping || {};

        // ---------- BASE FORM FIELDS + MAPPED SHIPPING ----------
        setForm((prev) => ({
          ...prev,
          name: p.name,
          price: p.price,
          oldPrice: p.old_price || "",
          stock: p.stock,
          tag: p.tag || "",
          descriptionShort: p.description_short || "",
          descriptionLong: p.description_long || "",
          sizes: p.sizes || [],
          features: p.features?.length ? p.features : [""],
          shipping: {
            ...prev.shipping,
            courierCharge:
              shippingRaw.courier_charge != null
                ? String(shippingRaw.courier_charge)
                : "",
            courierDesc: shippingRaw.courier_desc || "",
            homeDeliveryCharge:
              shippingRaw.home_delivery_charge != null
                ? String(shippingRaw.home_delivery_charge)
                : "",
            homeDeliveryDesc: shippingRaw.home_delivery_desc || "",
            outsideValleyCharge:
              shippingRaw.outside_valley_charge != null
                ? String(shippingRaw.outside_valley_charge)
                : "",
            outsideValleyDesc: shippingRaw.outside_valley_desc || "",
            customRules: prev.shipping.customRules || [],
          },
          exclusiveOfferEnd: p.exclusive_offer_end || "",
        }));

        // ---------- IMAGES ----------
        if (p.images?.length > 0) {
          const fullUrls = p.images.map(
            (img) => `http://localhost:5000${img}`
          );
          setServerImages(fullUrls); // existing images from server
        } else {
          setServerImages([]);
        }
        // reset new images & previews on load
        setNewImages([]);
        setNewPreviews([]);

        // ---------- REBUILD CUSTOM SHIPPING OPTIONS ----------
        const newCustom = {
          courierCharge: [],
          homeDeliveryCharge: [],
          outsideValleyCharge: [],
        };

        ["courierCharge", "homeDeliveryCharge", "outsideValleyCharge"].forEach(
          (field) => {
            let amountRaw;
            let desc;

            if (field === "courierCharge") {
              amountRaw = shippingRaw.courier_charge;
              desc = shippingRaw.courier_desc;
            } else if (field === "homeDeliveryCharge") {
              amountRaw = shippingRaw.home_delivery_charge;
              desc = shippingRaw.home_delivery_desc;
            } else {
              amountRaw = shippingRaw.outside_valley_charge;
              desc = shippingRaw.outside_valley_desc;
            }

            if (!amountRaw) return;

            const amount = String(amountRaw);
            const d = desc || "";

            // Only treat as "custom" if it's NOT in preset list
            if (!PRESET_SHIPPING_VALUES[field].includes(amount)) {
              newCustom[field].push({ amount, desc: d });
            }
          }
        );

        setCustomShippingValues(newCustom);
      } catch (err) {
        console.log("Edit load failed:", err);
      } finally {
        setLoadingEdit(false);
      }
    }

    loadProduct();
  }, [editId]);

  /* ============================================================
        FORM CHANGE HANDLERS
  ============================================================ */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingChange = (field, value, desc = "") => {
    const descKey =
      field === "courierCharge"
        ? "courierDesc"
        : field === "homeDeliveryCharge"
        ? "homeDeliveryDesc"
        : "outsideValleyDesc";

    setForm((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value,
        [descKey]: desc,
      },
    }));
  };

  /* ============================================================
        IMAGE HANDLING
  ============================================================ */
  const handleAddImagesClick = () => fileInputRef.current?.click();

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const urls = files.map((file) => URL.createObjectURL(file));

    setNewImages((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (index) => {
    const serverCount = serverImages.length;

    // Removing a server image
    if (index < serverCount) {
      setServerImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    // Removing a newly added image
    const newIndex = index - serverCount;
    setNewImages((prev) => prev.filter((_, i) => i !== newIndex));

    setNewPreviews((prev) => {
      const toRevoke = prev[newIndex];
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== newIndex);
    });
  };

  /* ============================================================
        FEATURES
  ============================================================ */
  const handleFeatureChange = (index, value) => {
    const updated = [...form.features];
    updated[index] = value;
    setForm((prev) => ({ ...prev, features: updated }));
  };

  const addFeatureField = () =>
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));

  /* ============================================================
        CUSTOM AMOUNT POPUP
  ============================================================ */
  const openCustomAmountPopup = (field) => {
    setCustomTargetField(field);
    setCustomAmount("");
    setCustomDesc("");
    setShowCustomAmount(true);
  };

  const saveCustomAmount = () => {
    if (!customTargetField || !customAmount) {
      setShowCustomAmount(false);
      return;
    }

    // update shipping value + desc
    handleShippingChange(customTargetField, customAmount, customDesc);

    // add this to dropdown options
    setCustomShippingValues((prev) => ({
      ...prev,
      [customTargetField]: [
        ...prev[customTargetField],
        { amount: customAmount, desc: customDesc },
      ],
    }));

    setShowCustomAmount(false);
  };

  /* ============================================================
        SUBMIT HANDLER
  ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryId) {
      setErrorMsg("Category not loaded. Try again.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const fd = new FormData();

      // BASIC FIELDS
      fd.append("name", form.name);
      fd.append("category_id", categoryId);
      fd.append("price", form.price);
      fd.append("oldPrice", form.oldPrice);
      fd.append("stock", form.stock);
      fd.append("tag", form.tag);
      fd.append("descriptionShort", form.descriptionShort);
      fd.append("descriptionLong", form.descriptionLong);
      fd.append("exclusiveOfferEnd", form.exclusiveOfferEnd || "");

      // ARRAY FIELDS (features + sizes)
      fd.append("sizes", JSON.stringify(form.sizes));
      fd.append("features", JSON.stringify(form.features));

      // SHIPPING
      fd.append("shipping", JSON.stringify(form.shipping));

      // EXISTING SERVER IMAGES TO KEEP
      const existing = serverImages.map((url) =>
        url.replace("http://localhost:5000", "")
      );
      fd.append("existingImages", JSON.stringify(existing));

      // NEWLY ADDED IMAGES
      newImages.forEach((file) => fd.append("images", file));

      // SEND REQUEST
      const url = editId
        ? `http://localhost:5000/api/admin/products/${editId}`
        : `http://localhost:5000/api/admin/products`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save product");

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
        LOADING UI
  ============================================================ */
  if (!categoryId || (editId && loadingEdit)) {
    return (
      <div className="add-product-modal-overlay">
        <div className="add-product-modal">
          <h2>{editId ? "Loading Product..." : "Loading Category..."}</h2>
        </div>
      </div>
    );
  }

  // combined previews for rendering (server images first, then new images)
  const allPreviews = [...serverImages, ...newPreviews];

  /* ============================================================
        UI
  ============================================================ */
  return (
    <div className="add-product-modal-overlay">
      <div className="add-product-modal">
        <button className="add-prod-close-btn" onClick={onClose}>
          ✖
        </button>

        <h2 className="add-prod-title">
          {editId ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit} className="add-prod-form">
          <div className="add-prod-grid">
            {/* LEFT SIDE */}
            <div className="add-prod-left">
              <label>
                Product Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </label>

              <label>
                Price
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </label>

              <label>
                Sizes
                <input
                  type="text"
                  value={form.sizes.join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "sizes",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </label>

              {/* IMAGES */}
              <div className="add-prod-upload-block">
                <span className="field-label">Upload Images</span>
                <div className="image-upload-row">
                  {allPreviews.map((src, idx) => (
                    <div key={idx} className="image-thumb">
                      <img src={src} alt="preview" />
                      <button
                        type="button"
                        className="image-delete-btn"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ✖
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-more-images-box"
                    onClick={handleAddImagesClick}
                  >
                    + Add More Images
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFilesSelected}
                  />
                </div>
              </div>

              {/* FEATURES */}
              <div className="add-prod-features-block">
                <span className="field-label">Features</span>

                {form.features.map((feat, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={feat}
                    placeholder="Feature..."
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  />
                ))}

                <button
                  type="button"
                  className="link-button"
                  onClick={addFeatureField}
                >
                  + Add Feature
                </button>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="add-prod-right">
              <label>
                Category
                <input
                  type="text"
                  value={finalCategorySlug.replace("-", " ")}
                  disabled
                />
              </label>

              <label>
                Old Price
                <input
                  type="number"
                  value={form.oldPrice}
                  onChange={(e) => handleChange("oldPrice", e.target.value)}
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => handleChange("stock", e.target.value)}
                />
              </label>

              <label>
                Tag
                <select
                  value={form.tag}
                  onChange={(e) => handleChange("tag", e.target.value)}
                >
                  <option value="">Select Tag</option>
                  {TAG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {form.tag === "exclusive-offer" && (
                <label>
                  Exclusive Offer Ends At
                  <input
                    type="datetime-local"
                    value={form.exclusiveOfferEnd}
                    onChange={(e) =>
                      handleChange("exclusiveOfferEnd", e.target.value)
                    }
                  />
                </label>
              )}

              <label>
                Description Title
                <input
                  type="text"
                  value={form.descriptionShort}
                  onChange={(e) =>
                    handleChange("descriptionShort", e.target.value)
                  }
                />
              </label>

              <label>
                Description Long Summary
                <textarea
                  rows={5}
                  value={form.descriptionLong}
                  onChange={(e) =>
                    handleChange("descriptionLong", e.target.value)
                  }
                />
              </label>

              {/* SHIPPING FIELDS */}
              {["courierCharge", "homeDeliveryCharge", "outsideValleyCharge"].map(
                (field) => (
                  <div className="ship-field" key={field}>
                    <label>{shippingFieldLabel[field]}</label>

                    <select
                      value={form.shipping[field]}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          openCustomAmountPopup(field);
                        } else {
                          // preset or existing custom amount
                          handleShippingChange(field, e.target.value, "");
                        }
                      }}
                    >
                      <option value="">Select...</option>

                      {/* DEFAULT PRICES */}
                      {field === "courierCharge" && (
                        <>
                          <option value="50">Rs. 50</option>
                          <option value="70">Rs. 70</option>
                          <option value="100">Rs. 100</option>
                          <option value="120">Rs. 120</option>
                          <option value="150">Rs. 150</option>
                        </>
                      )}

                      {field === "homeDeliveryCharge" && (
                        <>
                          <option value="50">Rs. 50</option>
                          <option value="70">Rs. 70</option>
                          <option value="120">Rs. 120</option>
                          <option value="150">Rs. 150</option>
                        </>
                      )}

                      {field === "outsideValleyCharge" && (
                        <>
                          <option value="100">Rs. 100</option>
                          <option value="120">Rs. 120</option>
                          <option value="150">Rs. 150</option>
                        </>
                      )}

                      {/* CUSTOM VALUES */}
                      {customShippingValues[field].map((obj, idx) => (
                        <option key={idx} value={obj.amount}>
                          Rs. {obj.amount}
                          {obj.desc ? ` - ${obj.desc}` : ""}
                        </option>
                      ))}

                      <option value="custom">Custom Amount...</option>
                    </select>
                  </div>
                )
              )}
            </div>
          </div>

          {/* CUSTOM AMOUNT POPUP */}
          {showCustomAmount && (
            <div className="popup-overlay">
              <div className="popup-box">
                <h3>Custom Amount</h3>

                <label>Amount (Rs.)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />

                <label>Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                />

                <div className="popup-actions">
                  <button
                    className="save-btn"
                    type="button"
                    onClick={saveCustomAmount}
                  >
                    Save
                  </button>
                  <button
                    className="cancel-btn"
                    type="button"
                    onClick={() => setShowCustomAmount(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {errorMsg && <p className="error-text">{errorMsg}</p>}

          {/* FOOTER */}
          <div className="add-prod-footer">
            <button className="save-product-btn" disabled={submitting}>
              {submitting ? "Saving..." : editId ? "Update Product" : "Save Product"}
            </button>

            <button
              className="cancel-btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
