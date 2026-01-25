import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

// ✅ App scoped styles (NO global leak)
import styles from "./App.module.css";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage/AboutPage";
// Product Details Page
import ProductDetailsPage from "./pages/ProductDetails/ProductDetailsPage";
// Buy Now Page
import BuyNowPage from "./pages/BuyNowPage/BuyNowPage";
// Order Confirmation Page
import ProductConfirmationPage from "./pages/ProductConfirmationPage/ProductConfirmationPage";
// Order Success Page
import OrderSuccessPage from "./pages/OrderSuccessPage/OrderSuccessPage";
// Error Page (404, invalid routes, etc.)
import ErrorPage from "./pages/ErrorPage/ErrorPage";
// My Order Detail Page
import MyOrderDetailPage from "./pages/MyOrderDetailPage/MyOrderDetailPage";
// My Orders List Page
import MyOrdersPage from "./pages/MyOrdersPage/MyOrdersPage";
// Search Results Page
import SearchResultsPage from "./pages/SearchResults/SearchResultsPage";
// Cart Page
import MyCartPage from "./pages/MyCartPage/MyCartPage";
// Feedback Page
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";

import ForgetPasswordPage from "./pages/ForgetPasswordPage";

// User Category Pages
import CategoryPage from "./components/Category/CategoryPage";
import ShoesPage from "./components/Shoes/ShoesPage";
import ElectronicsPage from "./components/Electronics/ElectronicsPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminCategoryPage from "./pages/AdminCategoryPage";
import AdminOrdersPage from "./pages/AdminOrdersPage/AdminOrdersPage";
import AdminOrderHistoryPage from "./pages/AdminOrderHistoryPage/AdminOrderHistoryPage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage/AdminFeedbackPage";
import InventoryPage from "./pages/admin/Inventory/InventoryPage";
import SalesReportPage from "./pages/admin/SalesReport/SalesReportPage";
import UsersPage from "./pages/admin/Users/UsersPage";

// Components
import AddProductModal from "./components/AddProductModal";

// Route Protectors
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

/* ============================================================
   ROOT REDIRECT - Smart redirect based on auth status
============================================================ */
function RootRedirect() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  
  if (token) {
    // User is logged in - redirect to appropriate dashboard
    if (role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  // Not logged in - redirect to login
  return <Navigate to="/login" replace />;
}

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
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
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

          {/* ================= ABOUT PAGE ================= */}
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutPage />
              </ProtectedRoute>
            }
          />

          {/* ================= SEARCH RESULTS ================= */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResultsPage />
              </ProtectedRoute>
            }
          />

          {/* ================= CART PAGE ================= */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <MyCartPage />
              </ProtectedRoute>
            }
          />

          {/* ================= FEEDBACK PAGE ================= */}
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
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

          {/* ================= BUY NOW CHECKOUT PAGE ================= */}
          <Route
            path="/buy-now/:sessionId"
            element={
              <ProtectedRoute>
                <BuyNowPage />
              </ProtectedRoute>
            }
          />

          {/* ================= ORDER CONFIRMATION PAGE ================= */}
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <ProductConfirmationPage />
              </ProtectedRoute>
            }
          />

          {/* ================= ORDER SUCCESS PAGE ================= */}
          <Route
            path="/order-success/:orderId"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route for state-based orderId (fallback) */}
          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          {/* ================= MY ORDERS LIST PAGE ================= */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* ================= MY ORDER DETAIL PAGE ================= */}
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <MyOrderDetailPage />
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

          {/* ================= ADMIN ORDERS ================= */}
          <Route
            path="/admin/orders"
            element={
              <AdminProtectedRoute>
                <AdminOrdersPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <AdminProtectedRoute>
                <AdminFeedbackPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/order-history"
            element={
              <AdminProtectedRoute>
                <AdminOrderHistoryPage />
              </AdminProtectedRoute>
            }
          />

          {/* ================= ADMIN INVENTORY ================= */}
          <Route
            path="/admin/inventory"
            element={
              <AdminProtectedRoute>
                <InventoryPage />
              </AdminProtectedRoute>
            }
          />

          {/* ================= ADMIN SALES REPORT ================= */}
          <Route
            path="/admin/sales-report"
            element={
              <AdminProtectedRoute>
                <SalesReportPage />
              </AdminProtectedRoute>
            }
          />

          {/* ================= ADMIN USERS ================= */}
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <UsersPage />
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

          {/* ================= 404 CATCH-ALL ================= */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
