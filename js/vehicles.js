let vehicles = [];
let currentFilter = "ALL";
let isInitialized = false; // 👈 กันยิงซ้ำ

function initVehicles() {
  console.log("🔥 INIT VEHICLES");

  if (!isInitialized) {
    isInitialized = true;
  }

  fetchVehicles(); // 🔥 ยังโหลดทุกครั้ง
}
// โหลดข้อมูลจาก backend
async function fetchVehicles() {
  try {
    const res = await fetch("http://localhost:9000/vehicles");

    if (!res.ok) {
      throw new Error("API error");
    }

    const result = await res.json();
    vehicles = result.data;

    renderVehicles();

  } catch (err) {
    console.error("โหลดข้อมูลไม่สำเร็จ", err);
  }
}



function renderVehicles() {

  console.log("🚗 vehicles:", vehicles);
  const tbody = document.getElementById("vehicle-table");
  const searchInput = document.getElementById("search");

  if (!tbody || !searchInput) return;

  const search = searchInput.value.toLowerCase();
  tbody.innerHTML = "";

  vehicles
    .filter(v => {
  if (currentFilter !== "ALL" && v.status !== currentFilter) return false;

  // ✅ กัน null
  return (v.license_plate || "").toLowerCase().includes(search);
})

    .forEach(v => {

      // ✅ ต้องอยู่ในนี้เท่านั้น
      const isOverdue = v.next_service_km && v.mileage_km >= v.next_service_km;
      const isNear = v.next_service_km && (v.next_service_km - v.mileage_km < 3000);

      let serviceColor = "#94a3b8";
      if (isOverdue) serviceColor = "#ef4444"; // 🔴 แดง
      else if (isNear) serviceColor = "#facc15"; // 🟡 เหลือง

      const canEdit = window.auth.canEdit();
      const canDelete = window.auth.canDelete();

      console.log("render loop", v);

      const statusSelect = canEdit
        ? `
          <select onchange="changeStatus('${v.id}', this.value)">
            <option ${v.status === "ACTIVE" ? "selected" : ""}>ACTIVE</option>
            <option ${v.status === "IDLE" ? "selected" : ""}>IDLE</option>
            <option ${v.status === "MAINTENANCE" ? "selected" : ""}>MAINTENANCE</option>
            <option ${v.status === "RETIRED" ? "selected" : ""}>RETIRED</option>
          </select>
        `
        : `<span class="status">${v.status}</span>`;

      const deleteBtn = canDelete
        ? `<button class="btn-del" onclick="deleteVehicle('${v.id}')">Del</button>`
        : "";

      tbody.innerHTML += `
        <tr>
          <td>${v.id}</td>
          <td><strong>${v.license_plate}</strong></td>
          <td>${v.type}</td>
          <td>${v.brand} ${v.model}</td>
          <td>${v.year || "-"}</td>
          <td>${v.fuel_type || "-"}</td>

          <td>${statusSelect}</td>

          <td style="color: orange;">
            ${v.mileage_km?.toLocaleString() || 0} km
          </td>

          <td style="color:#94a3b8;">
            ${v.last_service_km?.toLocaleString() || "-"} km
          </td>

          <td style="color:${serviceColor}; font-weight:bold;">
            ${v.next_service_km?.toLocaleString() || "-"} km
            ${isOverdue ? " ⚠️" : ""}
          </td>

          <td>
            ${v.driver_name || "-"}
          </td>

          <td>
            <button class="btn-history">History</button>
            ${deleteBtn}
          </td>
        </tr>
      `;
    });
}

function setFilter(status, el) {
  currentFilter = status;

  document.querySelectorAll(".filters button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (el) el.classList.add("active");

  renderVehicles();
}

document.addEventListener("input", (e) => {
  if (e.target.id === "search") renderVehicles();
});
async function getVehicleById(id) {
  const res = await fetch(`http://localhost:9000/vehicles/${id}`);
  const result = await res.json();

  console.log("🚗 Vehicle:", result.data);
}
async function changeStatus(id, status) {

  if (!window.auth.canManage()) {
    alert("❌ Permission denied");
    return;
  }

  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify({ status })
  });

  fetchVehicles();
}

async function deleteVehicle(id) {

  if (!window.auth.canDelete()) {
    alert("❌ Only ADMIN can delete");
    return;
  }

  if (!confirm("Delete this vehicle?")) return;

  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + window.auth.getToken()
    }
  });

  fetchVehicles();
}

function openVehicleModal() {
  console.log("🔥 CLICK ADD VEHICLE"); // 👈 ใส่ตรงนี้

  document.getElementById("vehicleModal").classList.add("show");
  loadDrivers();
}

function closeVehicleModal() {
  document.getElementById("vehicleModal").classList.remove("show");
}


window.onclick = function (e) {
  const modal = document.getElementById("vehicleModal");
  if (e.target === modal) closeVehicleModal();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeVehicleModal();
});

async function submitVehicle() {

  if (!window.auth.canManage()) {
    alert("❌ Permission denied");
    return;
  }

  const license_plate = document.getElementById("v_plate").value;
  const type = document.getElementById("v_type").value;
  const status = document.getElementById("v_status").value;
  const fuel_type = document.getElementById("v_fuel").value;
  const brand = document.getElementById("v_brand").value;
  const model = document.getElementById("v_model").value;
  const year = document.getElementById("v_year").value;
const mileage_km = document.getElementById("v_mileage").value;
const last_service_km = document.getElementById("v_last_service").value;
const next_service_km = document.getElementById("v_next_service").value;
  const driver_id = document.getElementById("v_driver").value;

  if (!license_plate || !type || !driver_id) {
    alert("กรอกข้อมูลไม่ครบ");
    return;
  }

  await fetch("http://localhost:9000/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify({
  license_plate,
  type,
  status,
  brand,
  model,
  year,
  fuel_type,
  mileage_km,
  last_service_km,
  next_service_km,
  driver_id
})
  });

  closeVehicleModal();
  fetchVehicles(); // 🔥 reload table
}

async function loadDrivers() {
  const res = await fetch("http://localhost:9000/drivers");
  const result = await res.json();

  const select = document.getElementById("v_driver");

  select.innerHTML = `
  <option value="">-- Select Driver --</option>
  ${result.data.map(d => `
    <option value="${d.id}">
      ${d.name} (${d.id})
    </option>
  `).join("")}
`;
}