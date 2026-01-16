import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

// ✅ App scoped styles (NO global leak)
import styles from "./App.module.css";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
// Product Details Page
import ProductDetailsPage from "./pages/ProductDetails/ProductDetailsPage";

import ForgetPasswordPage from "./pages/ForgetPasswordPage";

// User Category Pages
import CategoryPage from "./components/Category/CategoryPage";
import ShoesPage from "./components/Shoes/ShoesPage";
import ElectronicsPage from "./components/Electronics/ElectronicsPage";

// Admin Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCategoryPage from "./pages/AdminCategoryPage";

// Components
import AddProductModal from "./components/AddProductModal";

// Route Protectors
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

/* ============================================================
   WRAPPER → ADD PRODUCT (Empty form)
============================================================ */
function AddProductRouteWrapper() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();

  // Save last category for navigation consistency
  localStorage.setItem("lastCategory", categorySlug);

  return (
    <AdminProtectedRoute>
      <AddProductModal
        categorySlug={categorySlug}
        onClose={() => navigate(`/admin/category/${categorySlug}`)}
        onSuccess={() => navigate(`/admin/category/${categorySlug}`)}
      />
    </AdminProtectedRoute>
  );
}

/* ============================================================
   WRAPPER → EDIT PRODUCT (Load product for editing)
============================================================ */
function EditProductRouteWrapper() {
  const navigate = useNavigate();
  const { id, slug } = useParams();

  return (
    <AdminProtectedRoute>
      <AddProductModal
        editId={id}
        categorySlug={slug}
        onClose={() => navigate(`/admin/category/${slug}`)}
        onSuccess={() => navigate(`/admin/category/${slug}`)}
      />
    </AdminProtectedRoute>
  );
}

/* ============================================================
   MAIN APP (SCOPED ROOT)
============================================================ */
function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forget-password" element={<ForgetPasswordPage />} />

          {/* ================= USER HOME ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* ================= USER DISCOVERY PAGES ================= */}
          <Route
            path="/shoes"
            element={
              <ProtectedRoute>
                <ShoesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/electronics"
            element={
              <ProtectedRoute>
                <ElectronicsPage />
              </ProtectedRoute>
            }
          />

          {/* ================= USER CATEGORY PAGES ================= */}
          <Route
            path="/category/:slug"
            element={
              <ProtectedRoute>
                <CategoryPage />
              </ProtectedRoute>
            }
          />
                  {/* ================= PRODUCT DETAILS PAGE ================= */}
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
          />


          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/category/:slug"
            element={
              <AdminProtectedRoute>
                <AdminCategoryPage />
              </AdminProtectedRoute>
            }
          />

          {/* ================= ADMIN PRODUCT ACTIONS ================= */}
          <Route
            path="/admin/add-product/:categorySlug"
            element={<AddProductRouteWrapper />}
          />

          <Route
            path="/admin/edit-product/:id/:slug"
            element={<EditProductRouteWrapper />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
