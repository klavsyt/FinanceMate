// auth.js
// Логика авторизации и регистрации
import { apiLogin, apiRegister } from "./api.js";
import { showAlert, clearAlert, showToast } from "./ui.js";

export function setupAuth(onAuthSuccess) {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showRegisterBtn = document.getElementById("show-register");
  const showLoginBtn = document.getElementById("show-login");
  const authSection = document.getElementById("auth-section");
  const mainSection = document.getElementById("main-section");
  const errorMsg = document.getElementById("auth-error");

  showRegisterBtn.onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    clearAlert(errorMsg);
  };
  showLoginBtn.onclick = () => {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    clearAlert(errorMsg);
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    clearAlert(errorMsg);
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const response = await apiLogin(username, password);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      authSection.style.display = "none";
      mainSection.style.display = "block";
      showToast("Вход выполнен успешно!", "success");
      onAuthSuccess();
    } else {
      const err = await response.json().catch(() => ({}));
      showAlert(errorMsg, "Ошибка входа: " + (err.detail || ""));
      showToast("Ошибка входа: " + (err.detail || ""), "danger");
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    clearAlert(errorMsg);
    const email = document.getElementById("reg-email").value;
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const response = await apiRegister(email, username, password);
    if (response.ok) {
      showAlert(errorMsg, "Регистрация успешна! Теперь войдите.", "success");
      showToast("Регистрация успешна! Теперь войдите.", "success");
      registerForm.reset();
      registerForm.style.display = "none";
      loginForm.style.display = "block";
    } else {
      const err = await response.json().catch(() => ({}));
      showAlert(errorMsg, "Ошибка регистрации: " + (err.detail || ""));
      showToast("Ошибка регистрации: " + (err.detail || ""), "danger");
    }
  };
}

export function logout() {
  localStorage.removeItem("token");
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("main-section").style.display = "none";
}
