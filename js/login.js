async function submitLogin() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:9000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.success) {
    document.getElementById("error").innerText = data.error.message;
    return;
  }

  // เก็บ token
  localStorage.setItem("token", data.accessToken);

  // 👉 กลับหน้าเดิม
  window.location.href = "index.html";
}