let vehicles = [];
let currentFilter = "ALL";
function initVehicles() {
  fetchVehicles();
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
  const tbody = document.getElementById("vehicle-table");
  const search = document.getElementById("search").value.toLowerCase();

  tbody.innerHTML = "";

  vehicles
    .filter(v => {
      if (currentFilter !== "ALL" && v.status !== currentFilter) return false;

      return v.license_plate.toLowerCase().includes(search);
    })
    .forEach(v => {

      const mileage = `
        ${v.mileage_km?.toLocaleString()} / ${v.next_service_km?.toLocaleString()}
      `;

      tbody.innerHTML += `
        <tr>
          <td>${v.id}</td>
          <td><strong>${v.license_plate}</strong></td>
          <td>${v.type}</td>
          <td>${v.brand} ${v.model}</td>

          <td>
            <select onchange="changeStatus('${v.id}', this.value)">
              <option ${v.status==="ACTIVE"?"selected":""}>ACTIVE</option>
              <option ${v.status==="IDLE"?"selected":""}>IDLE</option>
              <option ${v.status==="MAINTENANCE"?"selected":""}>MAINTENANCE</option>
              <option ${v.status==="RETIRED"?"selected":""}>RETIRED</option>
            </select>
          </td>

          <td style="color: orange;">
            ${mileage}
          </td>

          <td>${v.driver_name || '-'}</td>

          <td>
            <button class="btn-history">History</button>
            <button class="btn-del" onclick="deleteVehicle('${v.id}')">Del</button>
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

async function changeStatus(id, status) {
  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  fetchVehicles();
}

async function deleteVehicle(id) {
  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "DELETE"
  });

  fetchVehicles();
}

async function deleteVehicle(id) {
  if (!confirm("Delete this vehicle?")) return;

  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "DELETE"
  });

  fetchVehicles();
}



fetchVehicles();