import React, { useState, useMemo } from "react";
import "./SignupPage.css";
import signupIllustration from "../assets/images/signup-Illustration.png";
import homeIcon from "../assets/icons/home.png";
import { signupUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    question: false,
    answer: false,
    password: false,
    confirmPassword: false,
  });

  // Password strength validation
  const passwordChecks = useMemo(() => {
    return {
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasMinLength: password.length >= 8,
    };
  }, [password]);

  const isPasswordStrong = useMemo(() => {
    return Object.values(passwordChecks).every(Boolean);
  }, [passwordChecks]);

  // Field-level validation for inline error messages
  const fieldErrors = useMemo(() => {
    let passwordError = "";
    if (touched.password) {
      if (!password) {
        passwordError = "Password is required";
      } else if (!passwordChecks.hasMinLength) {
        passwordError = "At least 8 characters required";
      } else if (!passwordChecks.hasLowercase) {
        passwordError = "Add a lowercase letter (a-z)";
      } else if (!passwordChecks.hasUppercase) {
        passwordError = "Add an uppercase letter (A-Z)";
      } else if (!passwordChecks.hasNumber) {
        passwordError = "Add a number (0-9)";
      } else if (!passwordChecks.hasSpecial) {
        passwordError = "Add a special character (!@#$%...)";
      }
    }

    let confirmError = "";
    if (touched.confirmPassword) {
      if (!confirmPassword) {
        confirmError = "Please confirm your password";
      } else if (confirmPassword !== password) {
        confirmError = "Passwords do not match";
      }
    }

    return {
      username: touched.username && !username.trim() ? "Username is required" : "",
      question: touched.question && !question.trim() ? "Security question is required" : "",
      answer: touched.answer && !answer.trim() ? "Answer is required" : "",
      password: passwordError,
      confirmPassword: confirmError,
    };
  }, [username, question, answer, password, confirmPassword, touched, passwordChecks]);

  // Check if form is valid for button state
  const isFormValid = useMemo(() => {
    return (
      username.trim() &&
      question.trim() &&
      answer.trim() &&
      isPasswordStrong &&
      confirmPassword === password
    );
  }, [username, question, answer, password, confirmPassword, isPasswordStrong]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Mark all fields as touched on submit
    setTouched({
      username: true,
      question: true,
      answer: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      setErrorMsg("Please fill in all fields correctly");
      return;
    }

    try {
      setLoading(true);
      await signupUser(username, question, answer, password);
      setSuccessMsg("Account created successfully!");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setErrorMsg(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container fade-in">
      <img
        src={homeIcon}
        alt="home"
        className="home-icon icon-bounce"
        onClick={() => navigate("/")}
      />

      <div className="signup-wrapper pop-up">
        <div className="signup-card">
          <div className="signup-left hover-zoom">
            <img
              src={signupIllustration}
              alt="Signup"
              className="signup-image"
            />
          </div>

          <div className="signup-right slide-in-right">
            <h2 className="signup-title">Create Your Account</h2>

            {/* Global message box with reserved height */}
            <div className="message-box">
              <p className={`message-text ${errorMsg ? "error" : ""} ${successMsg ? "success" : ""}`}>
                {errorMsg || successMsg || "\u00A0"}
              </p>
            </div>

            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-fields">
                <div className="input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className={`signup-input ${fieldErrors.username ? "input-error" : ""}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => handleBlur("username")}
                    placeholder="Enter your username"
                  />
                  <span className="field-error">{fieldErrors.username || "\u00A0"}</span>
                </div>

                <div className="input-group">
                  <label>Security Question</label>
                  <input
                    type="text"
                    className={`signup-input ${fieldErrors.question ? "input-error" : ""}`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onBlur={() => handleBlur("question")}
                    placeholder="e.g., What is your pet's name?"
                  />
                  <span className="field-error">{fieldErrors.question || "\u00A0"}</span>
                </div>

                <div className="input-group">
                  <label>Answer</label>
                  <input
                    type="text"
                    className={`signup-input ${fieldErrors.answer ? "input-error" : ""}`}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onBlur={() => handleBlur("answer")}
                    placeholder="Your answer"
                  />
                  <span className="field-error">{fieldErrors.answer || "\u00A0"}</span>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className={`signup-input ${fieldErrors.password ? "input-error" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Min 8 chars, A-Z, a-z, 0-9, !@#$"
                  />
                  <span className="field-error">{fieldErrors.password || "\u00A0"}</span>
                  
                  {/* Password strength indicator */}
                  {password && (
                    <div className="password-strength">
                      <div className="strength-checks">
                        <span className={passwordChecks.hasMinLength ? "check-pass" : "check-fail"}>
                          {passwordChecks.hasMinLength ? "✓" : "○"} 8+ chars
                        </span>
                        <span className={passwordChecks.hasLowercase ? "check-pass" : "check-fail"}>
                          {passwordChecks.hasLowercase ? "✓" : "○"} a-z
                        </span>
                        <span className={passwordChecks.hasUppercase ? "check-pass" : "check-fail"}>
                          {passwordChecks.hasUppercase ? "✓" : "○"} A-Z
                        </span>
                        <span className={passwordChecks.hasNumber ? "check-pass" : "check-fail"}>
                          {passwordChecks.hasNumber ? "✓" : "○"} 0-9
                        </span>
                        <span className={passwordChecks.hasSpecial ? "check-pass" : "check-fail"}>
                          {passwordChecks.hasSpecial ? "✓" : "○"} !@#$
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    className={`signup-input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder="Re-enter your password"
                  />
                  <span className="field-error">{fieldErrors.confirmPassword || "\u00A0"}</span>
                </div>
              </div>

              <div className="button-container">
                <button 
                  className={`signup-btn ${!isFormValid || loading ? "btn-disabled" : ""}`}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;