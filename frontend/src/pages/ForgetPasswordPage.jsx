import React, { useState } from "react";
import { getSecurityQuestion, resetPassword } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./ForgetPassword.css";

const ForgetPasswordPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [phase, setPhase] = useState(1);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const showToast = (msg, type = "error") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleGetQuestion = async () => {
    try {
      const data = await getSecurityQuestion(username);
      setQuestion(data.question);
      setPhase(2);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      const data = await resetPassword(username, answer, newPassword);
      setShowPopup(true);

      setTimeout(() => {
        setShowPopup(false);
        navigate("/");
      }, 1800);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="forget-container">
      <div className="forget-card animate-card">

        {/* Toast inside card */}
        {toastMsg && (
          <div className={`toast ${toastType}`}>{toastMsg}</div>
        )}

        {/* Success Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h3>Password Updated 🎉</h3>
              <p>Redirecting you...</p>
            </div>
          </div>
        )}

        <h2>Forget Password</h2>

        {/* STEP 1 */}
        {phase === 1 && (
          <>
            <p>Enter Username</p>
            <div className="input-group">
              <span className="icon">👤</span>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="button-row">
              <button className="save-btn" onClick={handleGetQuestion}>Next</button>
              <button className="back-btn" onClick={() => navigate("/")}>Back</button>
            </div>
          </>
        )}

        {/* STEP 2 - OPTION C DESIGN */}
        {phase === 2 && (
          <>
            <div className="verify-box animate-verify">
              <div className="verify-header">
                <span className="verify-icon">🔐</span>
                <h3>Security Verification</h3>
              </div>

              <div className="verify-q">
                <p className="label">Security Question:</p>
                <p className="question">{question}</p>
              </div>
            </div>

            <div className="input-group">
              <span className="icon">📝</span>
              <input
                type="text"
                placeholder="Your Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>

            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="button-row">
              <button className="save-btn" onClick={handleResetPassword}>Save</button>
              <button className="back-btn" onClick={() => setPhase(1)}>Back</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgetPasswordPage;
