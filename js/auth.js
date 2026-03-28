let currentUser = {
  role: "GUEST",
  token: null
};

// decode JWT
function parseJwt(token) {
  const base64 = token.split('.')[1];
  return JSON.parse(atob(base64));
}

// โหลด token (ถ้ามี)
(function initAuth() {
  const token = localStorage.getItem("token");

  if (token) {
    currentUser.token = token;

    const payload = parseJwt(token);
    currentUser.role = payload.role;
  }
})();

// update ปุ่ม
function updateRoleUI() {
  const btn = document.getElementById("role-btn");
  if (!btn) return;

  btn.classList.remove("role-admin", "role-dispatcher");

  if (currentUser.role === "ADMIN") {
    btn.innerText = "ADMIN";
    btn.classList.add("role-admin");
  } 
  else if (currentUser.role === "DISPATCHER") {
    btn.innerText = "DISPATCHER";
    btn.classList.add("role-dispatcher");
  } 
  else {
    btn.innerText = "GUEST";
  }
}

// click ปุ่ม
function handleAuthClick() {

  // 👉 ยังไม่ login → ไปหน้า login
  if (currentUser.role === "GUEST") {
    window.location.href = "login.html";
  } 
  // 👉 login แล้ว → logout
  else {
    if (confirm("Logout ?")) {
      localStorage.removeItem("token");
      currentUser = { role: "GUEST", token: null };
      updateRoleUI();
    }
  }
}

window.auth = {
  getUser: () => currentUser,
  getToken: () => currentUser.token,
  handleAuthClick,
  updateRoleUI
};