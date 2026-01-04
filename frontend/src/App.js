import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import CategoryPage from "./components/Category/CategoryPage";

// ⭐ USER DISCOVERY PAGES (FROM HOME)
import ShoesPage from "./components/Shoes/ShoesPage";
import ElectronicsPage from "./components/Electronics/ElectronicsPage";




import ForgetPasswordPage from "./pages/ForgetPasswordPage";
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

  // Save categorySlug so Edit Product can return back to same category
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
    WRAPPER → EDIT PRODUCT (Loads product for editing)
============================================================ */
function EditProductRouteWrapper() {
  const navigate = useNavigate();
  const { id, slug } = useParams(); // product ID + category slug

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
    MAIN APP
============================================================ */
function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />

                     {/* ⭐ USER HOME PAGE */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomePage />   
            </ProtectedRoute>
          }
        />
                          {/* ============================================================
    USER DISCOVERY PAGES (OPENED FROM HOME)
    Shoes & Electronics
============================================================ */}
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

         


              {/* ✅ USER CATEGORY PAGES (Women / Men / Kids) */}
<Route
  path="/category/:slug"
  element={
    <ProtectedRoute>
      <CategoryPage />
    </ProtectedRoute>
  }
/>


    
        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />

        {/* CATEGORY PAGE */}
        <Route
          path="/admin/category/:slug"
          element={
            <AdminProtectedRoute>
              <AdminCategoryPage />
            </AdminProtectedRoute>
          }
        />

        {/* ADD PRODUCT */}
        <Route
          path="/admin/add-product/:categorySlug"
          element={<AddProductRouteWrapper />}
        />

        {/* EDIT PRODUCT */}
        <Route
          path="/admin/edit-product/:id/:slug"
          element={<EditProductRouteWrapper />}
        />
      </Routes>
    </Router>
  );
}

export default App;
