import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AdminCategoryPage.css";
import homeIcon from "../assets/icons/home.png";

export default function AdminCategoryPage() {
  const { slug: categorySlug } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(true);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* ============================
     LOAD CATEGORY DETAILS
  ============================ */
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoadingCategory(true);

        const res = await fetch(
          `http://localhost:5000/api/categories/${categorySlug}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Category not found");

        setCategory(data);
      } catch (error) {
        console.error("Category load error:", error);
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchCategory();
  }, [categorySlug]);

  /* ============================
     LOAD PRODUCTS FOR CATEGORY
  ============================ */
  const loadProducts = useCallback(async () => {
    if (!category?.id) return;

    try {
      setLoadingProducts(true);

      const res = await fetch(
        `http://localhost:5000/api/admin/products/category/${category.id}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load products");

      setProducts(data.products || []);
    } catch (error) {
      console.error("Product load error:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, [category]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ============================
     DELETE PRODUCT
  ============================ */
  const handleDeleteProduct = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/products/${deleteId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      setShowDeletePopup(false);
      setDeleteId(null);
      loadProducts();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loadingCategory) {
    return (
      <div className="category-page">
        <h1>Loading category...</h1>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="category-page">
        <h1>Category not found</h1>
      </div>
    );
  }

  return (
    <div className="category-page">
      {/* ============== HEADER ============== */}
      <div className="category-header">
        <h1>{category.name}</h1>

        <div className="header-right">
          <button className="home-btn" onClick={() => navigate("/admin-dashboard")}>
            <img src={homeIcon} alt="home" />
          </button>

          <button
            className="add-product-btn"
            onClick={() => navigate(`/admin/add-product/${category.slug}`)}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* ============== PRODUCT LIST ============== */}
      <div className="product-grid">
        {loadingProducts && <p className="no-products">Loading products...</p>}

        {!loadingProducts && products.length === 0 && (
          <p className="no-products">No products yet in this category.</p>
        )}

        {!loadingProducts &&
          products.map((p) => (
            <div className="product-card" key={p.id}>
              
              {/* IMAGE */}
              <div className="product-image">
                <img
                  src={
                    p.images?.length
                      ? `http://localhost:5000${p.images[0]}`
                      : "/no-image.png"
                  }
                  alt={p.name}
                />
              </div>

              {/* INFO */}
              <div className="product-info">
                <h3>{p.name}</h3>
                <p className="price">Rs. {p.price}</p>
                <p className="tag">{p.tag ? p.tag.replace("-", " ") : "No Tag"}</p>
              </div>

              {/* BUTTONS */}
              <div className="card-actions">

                {/* REMOVE VIEW BUTTON → ONLY Edit + Delete */}

                <button
                  className="edit-btn"
                  onClick={() =>
                    navigate(`/admin/edit-product/${p.id}/${category.slug}`)
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => {
                    setDeleteId(p.id);
                    setShowDeletePopup(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ============== DELETE CONFIRM POPUP ============== */}
      {showDeletePopup && (
        <div className="delete-overlay">
          <div className="delete-popup">
            <h2>Are you sure you want to delete this Product?</h2>
            <p>This action cannot be undone.</p>

            <div className="delete-buttons">
              <button
                className="cancel-delete"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>

              <button className="confirm-delete" onClick={handleDeleteProduct}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
