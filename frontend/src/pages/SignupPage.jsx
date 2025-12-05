import React, { useState } from "react";
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
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!username.trim()) return "Username is required";
    if (!question.trim()) return "Security question is required";
    if (!answer.trim()) return "Answer is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
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

            <div className="message-box">
              {errorMsg && <p className="error">{errorMsg}</p>}
              {successMsg && <p className="success">{successMsg}</p>}
            </div>

            <form onSubmit={handleSignup}>

              <label>Username</label>
              <input
                type="text"
                className="signup-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <label>Security Question</label>
              <input
                type="text"
                className="signup-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <label>Answer</label>
              <input
                type="text"
                className="signup-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              <label>Password</label>
              <input
                type="password"
                className="signup-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="signup-btn" type="submit">
                {loading ? "Creating..." : "Signup"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;