auth.updateRoleUI();
// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerText =
    now.toLocaleTimeString();
}
setInterval(updateClock, 1000);

// ===== NAVIGATION =====
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

async function navigate(page, el) {

  // โหลดหน้า
  const res = await fetch(page);
  const html = await res.text();

  document.getElementById("content").innerHTML = html;

  // เปลี่ยน active menu
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  el.classList.add("active");

  try {
    const res = await fetch(page);

    if (!res.ok) {
      throw new Error("โหลดหน้าไม่สำเร็จ: " + page);
    }

    const html = await res.text();

    document.getElementById("content").innerHTML = html;

 // 👇 ถ้าเป็นหน้า vehicles ให้โหลด JS
  if (page.includes("vehicles")) {
    loadScript("js/vehicles.js");
  }
    // active menu
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });

    if (el) el.classList.add("active");

  } catch (err) {
    console.error(err);
  }
}

let vehicles = [];

async function fetchVehicles() {
  const res = await fetch("http://localhost:9000/vehicles");
  const result = await res.json();

  vehicles = result.data;
  renderVehicles();
}

async function loadPage(page) {
  const res = await fetch(page);
  const html = await res.text();

  document.getElementById("content").innerHTML = html;
}

// โหลดหน้า default
loadPage("vehicles.html");

function renderVehicles() {
  const tbody = document.getElementById("vehicle-table");
  tbody.innerHTML = "";

  vehicles.forEach(v => {
    tbody.innerHTML += `
      <tr>
        <td>${v.id}</td>
        <td>${v.license_plate}</td>
        <td>${v.status}</td>
      </tr>
    `;
  });
}

function loadScript(src) {
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;

  script.onload = () => {
    if (typeof initVehicles === "function") {
      initVehicles();
    }
  };

  document.body.appendChild(script);
}

fetchVehicles();
navigate('dashboard.html', document.querySelector('.nav-item'));
// โหลด UI role ตอนเริ่ม
window.auth.updateRoleUI();