auth.updateRoleUI();
// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  document.getElementById("clock").innerText =
    now.toLocaleTimeString();
}


function loadScript(src) {

  // 🔥 ถ้าโหลดแล้ว → ไม่ต้องโหลดซ้ำ
  if (document.querySelector(`script[src="${src}"]`)) {
  console.log("Script already loaded:", src);
  return; 
}

  const script = document.createElement("script");
  script.src = src;
  script.defer = true;

  script.onload = () => {
    console.log("Loaded:", src);

    if (typeof initVehicles === "function") {
      initVehicles();
    }

    if (typeof initTrips === "function") {
    initTrips();  
  }
  };

  document.body.appendChild(script);
}

// ===== NAVIGATION =====
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

async function navigate(page, el) {


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

  if (page.includes("trips")) {
  loadScript("js/trips.js");
}
  if (page.includes("dashboard")) {
    setTimeout(() => {
    loadDashboard();
    loadTripStats();   // 👈 เพิ่มตรงนี้
  }, 100);
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

async function loadDashboard() {
  try {
    const res = await fetch("http://localhost:9000/vehicles");
    const result = await res.json();

    const vehicles = result.data;

    // 🔢 จำนวนรถทั้งหมด
    document.getElementById("total").innerText = vehicles.length;

    // 🚗 จำนวนประเภท
    const types = new Set(vehicles.map(v => v.type));
    document.getElementById("types").innerText =
      types.size + " types in fleet";

  } catch (err) {
    console.error("โหลด dashboard ไม่สำเร็จ", err);
  }
}
async function loadTripStats() {
  console.log(trips);
  try {
    const res = await fetch("http://localhost:9000/trips");
    const result = await res.json();

    const trips = result.data;

    const today = new Date().toISOString().slice(0, 10);

    // วันนี้
    const todayTrips = trips.filter(t =>
      t.status === "IN_PROGRESS" &&
      t.started_at &&
      t.started_at.slice(0, 10) === today
    );

    // เมื่อวาน
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    const yesterdayTrips = trips.filter(t =>
      t.status === "IN_PROGRESS" &&
      t.started_at &&
      t.started_at.slice(0, 10) === yesterday
    );

    // set ค่า
    document.getElementById("activeTrips").innerText = todayTrips.length;

    document.getElementById("compareTrips").innerText =
      `${todayTrips.length - yesterdayTrips.length} vs yesterday`;

  } catch (err) {
    console.error("โหลด trip stats ไม่สำเร็จ", err);
  }
}
navigate('dashboard.html', document.querySelector('.nav-item'));
// โหลด UI role ตอนเริ่ม
window.auth.updateRoleUI();