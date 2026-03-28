let vehicles = [];

async function fetchVehiclesAdmin() {
  const res = await fetch("http://localhost:9000/vehicles");
  const result = await res.json();

  vehicles = result.data;
  renderAdmin();
}

function renderAdmin() {
  const tbody = document.getElementById("admin-table");
  tbody.innerHTML = "";

  vehicles.forEach(v => {
    tbody.innerHTML += `
      <tr>
        <td>${v.id}</td>
        <td>${v.license_plate}</td>
        <td>${v.status}</td>
        <td>
          <button onclick="deleteVehicle('${v.id}')">ลบ</button>
        </td>
      </tr>
    `;
  });
}

// ➕ เพิ่ม
async function addVehicle() {
  const plate = document.getElementById("plate").value;
  const status = document.getElementById("status").value;

  await fetch("http://localhost:9000/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + auth.getToken()
    },
    body: JSON.stringify({
      id: "veh_" + Date.now(),
      license_plate: plate,
      status: status
    })
  });

  fetchVehiclesAdmin();
}

// ❌ ลบ
async function deleteVehicle(id) {
  await fetch(`http://localhost:9000/vehicles/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + auth.getToken()
    }
  });

  fetchVehiclesAdmin();
}

fetchVehiclesAdmin();