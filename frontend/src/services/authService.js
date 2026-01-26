// src/services/authService.js

import { setToken, setRole, getToken, validateToken } from "../utils/auth";

export async function loginUser(username, password) {
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  // ⭐ SAVE JWT TOKEN + ROLE using auth utilities
  if (data.token) {
    setToken(data.token);
  }

  if (data.role) {
    setRole(data.role);
  }

  return data;
}

export async function signupUser(username, question, answer, password) {
  const response = await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      security_question: question,
      security_answer: answer,
      password: password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
}

// ⭐ PROTECTED REQUEST (with token validation)
export async function fetchProtected(url) {
  const token = getToken();
  const { valid } = validateToken(token);
  
  if (!valid) {
    throw new Error("Authentication required");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Authentication required");
  }

  return response.json();
}

export async function getSecurityQuestion(username) {
  const response = await fetch("http://localhost:5000/api/auth/get-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message);

  return data;
}

export async function resetPassword(username, security_answer, new_password) {
  const response = await fetch("http://localhost:5000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, security_answer, new_password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message);

  return data;
}
