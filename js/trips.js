let trips = [];
let editingTripId = null;
let formMode = "create"; // create | edit
function initTrips() {
  console.log("🔥 INIT TRIPS");
  fetchTrips();
}

function openCreateModal() {
  formMode = "create";
  editingTripId = null;

  // reset form
  document.getElementById("vehicle_id").value = "";
  document.getElementById("driver_id").value = "";
  document.getElementById("origin").value = "";
  document.getElementById("destination").value = "";
  document.getElementById("distance_km").value = "";
  document.getElementById("cargo_weight_kg").value = "";

  document.getElementById("cargo_type").value = "GENERAL";
  document.getElementById("edit_status").value = "SCHEDULED";

  document.getElementById("started_at").value = "";
  document.getElementById("ended_at").value = "";

  document.querySelector(".modal-content h2").innerText = "➕ Create Trip";

  openModal();
}
function openEditModal(id) {
  const trip = trips.find(t => t.id === id);
  if (!trip) return;

  formMode = "edit";
  editingTripId = id;

  document.getElementById("vehicle_id").value = trip.vehicle_id;
  document.getElementById("driver_id").value = trip.driver_id;
  document.getElementById("origin").value = trip.origin;
  document.getElementById("destination").value = trip.destination;
  document.getElementById("distance_km").value = trip.distance_km || "";

  document.getElementById("cargo_type").value = trip.cargo_type;
  document.getElementById("cargo_weight_kg").value = trip.cargo_weight_kg || "";

  document.getElementById("edit_status").value = trip.status;

  document.getElementById("started_at").value =
    trip.started_at ? trip.started_at.slice(0, 16) : "";

  document.getElementById("ended_at").value =
    trip.ended_at ? trip.ended_at.slice(0, 16) : "";

  document.querySelector(".modal-content h2").innerText = "✏️ Edit Trip";

  openModal();
}

function formatDisplayDate(value) {
  if (!value) return "-";

  const d = new Date(value);

  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
// ================= FETCH =================
async function fetchTrips() {
  const res = await fetch("http://localhost:9000/trips");
  const result = await res.json();

  trips = result.data;
  renderTrips(trips);
}
function formatDateTime(value) {
  if (!value) return null;

  const d = new Date(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
}
// ================= RENDER =================
function renderTrips(trips) {
  const tbody = document.getElementById("trip-table");
  if (!tbody) return;

  tbody.innerHTML = "";

  trips.forEach(t => {

    let actionBtn = `<span style="color:gray">view only</span>`;

    if (window.auth.canManage()) {

      let buttons = "";


      // 🟠 Edit (ADMIN + DISPATCHER)
      buttons += `
        <button class="btn-edit" onclick="openEditModal('${t.id}')">
          Edit
        </button>
      `;

      actionBtn = buttons;
    }

    tbody.innerHTML += `
<tr>
  <td>${t.id}</td>
  <td>${t.vehicle_id}</td>
  <td>${t.driver_id}</td>

  <td>${t.origin} → ${t.destination}</td>

  <td>
    <span class="badge ${t.cargo_type}">
      ${t.cargo_type}
    </span><br>
    <small>${t.cargo_weight_kg || "N/A"} kg</small>
  </td>

  <td>${t.distance_km || "N/A"} km</td>

  <td>${formatDisplayDate(t.started_at)}</td>
  <td>${formatDisplayDate(t.ended_at)}</td>

  <!-- 🔥 STATUS ต้องอยู่ตรงนี้ -->
  <td>
    <span class="status ${t.status}">
      ${t.status}
    </span>
  </td>

  <td>${actionBtn}</td>
</tr>
`;
  });
}

function goToTracker(id) {
  window.location.href = `tracker.html`;
}
// ================= ACTION =================
async function completeTrip(id) {

  if (!window.auth.canManage()) {
    alert("❌ Permission denied");
    return;
  }

  await fetch(`http://localhost:9000/trips/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify({
      status: "COMPLETED",
      ended_at: new Date().toISOString()
    })
  });

  fetchTrips();
}

function openModal() {
  document.getElementById("tripModal").classList.add("show");
}

function closeModal() {
  document.getElementById("tripModal").classList.remove("show");
}


// ================= CREATE =================
async function submitTrip() {

  if (!window.auth.canManage()) {
    alert("❌ Permission denied");
    return;
  }

  const payload = {
    vehicle_id: document.getElementById("vehicle_id").value,
    driver_id: document.getElementById("driver_id").value,
    origin: document.getElementById("origin").value,
    destination: document.getElementById("destination").value,
    distance_km: document.getElementById("distance_km").value || null,
    cargo_type: document.getElementById("cargo_type").value,
    cargo_weight_kg: document.getElementById("cargo_weight_kg").value || null,
    status: document.getElementById("edit_status").value,
    started_at: formatDateTime(document.getElementById("started_at")?.value),
    ended_at: formatDateTime(document.getElementById("ended_at")?.value)
  };

  if (formMode === "edit") {
  await fetch(`http://localhost:9000/trips/${editingTripId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify(payload)
  });
} else {
  await fetch("http://localhost:9000/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify(payload)
  });
}
  closeModal();
  fetchTrips();
}


