import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import loginIllustration from "../assets/images/login-illustration.png";
import { loginUser } from "../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAuthReady, isAdmin } = useAuth();

  // Get the intended destination from location state (if redirected from ProtectedRoute)
  const from = location.state?.from || sessionStorage.getItem("authRedirect") || null;
  
  // Get auth message (e.g., "Please login to continue")
  const authMessage = sessionStorage.getItem("authMessage");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(authMessage || "");
  const [successMsg, setSuccessMsg] = useState("");

  // Clear auth messages after showing
  useEffect(() => {
    if (authMessage) {
      sessionStorage.removeItem("authMessage");
    }
  }, [authMessage]);

  // ⭐ REDIRECT AWAY FROM LOGIN IF ALREADY AUTHENTICATED
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      // Clear stored redirect
      sessionStorage.removeItem("authRedirect");
      
      // User is already logged in - redirect them away from login page
      if (isAdmin) {
        navigate("/admin-dashboard", { replace: true });
      } else if (from && from !== "/login" && from !== "/signup") {
        navigate(from, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAuthReady, isAdmin, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // ⭐ CALL BACKEND LOGIN API
      const data = await loginUser(username, password);

      // ⭐ USE AUTH CONTEXT TO LOGIN
      const loginSuccess = login(data.token, {
        id: data.userId,
        username: data.username,
        role: data.role,
      });

      if (!loginSuccess) {
        setErrorMsg("Login failed: Invalid token received");
        return;
      }

      // Also save role for backward compatibility
      localStorage.setItem("role", data.role);

      setSuccessMsg("Login successful!");
      
      // Clear stored redirect
      sessionStorage.removeItem("authRedirect");

      // ⭐ ROLE-BASED REDIRECTION (with support for intended destination)
      // Use shorter timeout for better UX
      setTimeout(() => {
        if (data.role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (from && from !== "/login" && from !== "/signup") {
          navigate(from, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card pop-up">

        {/* LEFT SIDE */}
        <div className="login-left hover-bounce">
          <img
            src={loginIllustration}
            alt="Akira Store Login Illustration"
            className="login-image"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right slide-in-right">
          <h2 className="login-title">USER LOGIN</h2>

          {errorMsg && <p className="error-line">⚠️ {errorMsg}</p>}


          {successMsg && <p className="success-msg">{successMsg}</p>}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div className="input-row input-animate">
              <div className="icon-box"><span>👤</span></div>
              <input
                type="text"
                className="input-field"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="input-row input-animate">
              <div className="icon-box"><span>🔒</span></div>
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <p
              className="forgot-text link-hover"
              onClick={() => navigate("/forget-password")}
            >
              Forget Password
            </p>

            <button className="login-btn btn-animate" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "LOGIN"}
            </button>

            <p
              className="create-text link-hover"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;