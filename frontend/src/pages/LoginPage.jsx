import React, { useState } from "react";
import "./LoginPage.css";
import loginIllustration from "../assets/images/login-illustration.png";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

  try {
      // ⭐ CALL BACKEND LOGIN API
      const data = await loginUser(username, password);

      // ⭐ SAVE TOKEN + USERNAME + ROLE
      localStorage.setItem("authToken", data.token);   // token
      localStorage.setItem("username", data.username); // ⭐ NEW
      localStorage.setItem("role", data.role);         // ⭐ NEW

      setSuccessMsg("Login successful!");

      // ⭐ ROLE-BASED REDIRECTION
      setTimeout(() => {
        if (data.role === "admin") {
          navigate("/admin-dashboard");      // ⭐ ADMIN GO HERE
        } else {
          navigate("/dashboard");            // ⭐ NORMAL USER
        }
      }, 800);
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