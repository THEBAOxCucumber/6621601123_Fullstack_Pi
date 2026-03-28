let trips = [];

function initTrips() {
  fetchTrips();
}

// ================= FETCH =================
async function fetchTrips() {
  const res = await fetch("http://localhost:9000/trips");
  const result = await res.json();

  trips = result.data;
  renderTrips();
}

// ================= RENDER =================
function renderTrips() {
  const tbody = document.getElementById("trip-table");
  if (!tbody) return;

  tbody.innerHTML = "";

  trips.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td>${t.id}</td>
        <td>${t.vehicle_id}</td>
        <td>${t.driver_id}</td>
        <td>${t.origin} → ${t.destination}</td>
        <td><span class="badge">${t.cargo_type}</span></td>
        <td>${t.distance_km || 0} km</td>

        <td>
          <span class="status ${t.status.toLowerCase()}">
            ${t.status}
          </span>
        </td>

        <td>
          ${t.status === "IN_PROGRESS"
            ? `<button class="btn-complete" onclick="completeTrip('${t.id}')">Complete</button>`
            : ""
          }
          <button class="btn-track">Track</button>
        </td>
      </tr>
    `;
  });
}

// ================= ACTION =================
async function completeTrip(id) {
  await fetch(`http://localhost:9000/trips/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "COMPLETED",
      ended_at: new Date()
    })
  });

  fetchTrips();
}

// ================= CREATE =================
async function createTrip() {
  const vehicle_id = prompt("Vehicle ID:");
  const driver_id = prompt("Driver ID:");
  const origin = prompt("Origin:");
  const destination = prompt("Destination:");

  if (!vehicle_id || !driver_id) return;

  await fetch("http://localhost:9000/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      vehicle_id,
      driver_id,
      origin,
      destination
    })
  });

  fetchTrips();
}