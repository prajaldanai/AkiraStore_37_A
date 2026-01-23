import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AdminCategoryPage.css";

export default function AdminCategoryPage() {
  const { slug: categorySlug } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(true);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockFilter, setStockFilter] = useState("all"); // all, in-stock, low-stock, out-of-stock
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, price-low, price-high, name-asc, name-desc

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
     FILTERED & SORTED PRODUCTS
  ============================ */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Price range filter
    if (priceRange.min !== "") {
      result = result.filter((p) => parseFloat(p.price) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== "") {
      result = result.filter((p) => parseFloat(p.price) <= parseFloat(priceRange.max));
    }

    // Stock filter
    if (stockFilter === "in-stock") {
      result = result.filter((p) => (p.stock || 0) > 5);
    } else if (stockFilter === "low-stock") {
      result = result.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
    } else if (stockFilter === "out-of-stock") {
      result = result.filter((p) => (p.stock || 0) === 0);
    }

    // Tag filter
    if (tagFilter !== "all") {
      result = result.filter((p) => p.tag === tagFilter);
    }

    // Sorting
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "price-low":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name-asc":
        result.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name?.localeCompare(a.name));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }, [products, searchQuery, priceRange, stockFilter, tagFilter, sortBy]);

  // Get unique tags for filter
  const availableTags = useMemo(() => {
    const tags = [...new Set(products.map((p) => p.tag).filter(Boolean))];
    return tags;
  }, [products]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setStockFilter("all");
    setTagFilter("all");
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || priceRange.min || priceRange.max || stockFilter !== "all" || tagFilter !== "all" || sortBy !== "newest";

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
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1>{category.name}</h1>
          <span className="product-count">{filteredProducts.length} of {products.length} products</span>
        </div>

        <div className="header-right">
          <button className="home-btn" onClick={() => navigate("/admin-dashboard")}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L10 3L17 10M5 8V16C5 16.5523 5.44772 17 6 17H8V12H12V17H14C14.5523 17 15 16.5523 15 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className="add-product-btn"
            onClick={() => navigate(`/admin/add-product/${category.slug}`)}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* ============== FILTER SECTION ============== */}
      <div className="filter-section">
        {/* Search */}
        <div className="filter-group search-group">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Price Range */}
        <div className="filter-group price-group">
          <label>Price:</label>
          <input
            type="number"
            className="filter-input price-input"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <span className="price-separator">-</span>
          <input
            type="number"
            className="filter-input price-input"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>

        {/* Stock Filter */}
        <div className="filter-group">
          <select
            className="filter-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt;5)</option>
            <option value="low-stock">Low Stock (1-5)</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div className="filter-group">
          <select
            className="filter-select"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="filter-group">
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* ============== PRODUCT LIST ============== */}
      <div className="product-grid">
        {loadingProducts && <p className="no-products">Loading products...</p>}

        {!loadingProducts && filteredProducts.length === 0 && products.length > 0 && (
          <p className="no-products">No products match your filters. <button className="link-btn" onClick={clearFilters}>Clear filters</button></p>
        )}

        {!loadingProducts && products.length === 0 && (
          <p className="no-products">No products yet in this category.</p>
        )}

        {!loadingProducts &&
          filteredProducts.map((p) => (
            <div className="product-card" key={p.id}>
              
              {/* STOCK BADGE */}
              {(p.stock || 0) === 0 && <span className="stock-badge out">Out of Stock</span>}
              {(p.stock || 0) > 0 && (p.stock || 0) <= 5 && <span className="stock-badge low">Low Stock ({p.stock})</span>}
              
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
                <p className="stock-text">Stock: {p.stock || 0}</p>
              </div>

              {/* BUTTONS */}
              <div className="card-actions">
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
