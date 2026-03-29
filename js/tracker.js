(function () {

let trips = [];
let currentTripId = null;
let checkpoints = [];

// ✅ ไม่ชนอีกแน่นอน
const currentUser = window.auth?.getUser?.() || { role: "GUEST" };

const params = new URLSearchParams(window.location.search);
const tripId = params.get("trip_id");

console.log("Tracking trip:", tripId);

// ================= INIT =================
function initTracker() {

  setInterval(() => {
    if (currentTripId) {
      loadCheckpoints(currentTripId);
    }
  }, 3000);

  if (currentUser.role === "GUEST") {
    document.getElementById("addCheckpointBtn").style.display = "none";
  }

  setupAddCheckpoint(); // ✅ เพิ่มตรงนี้
  loadTrips();
}

// ================= LOAD TRIPS =================
async function loadTrips() {
  const res = await fetch("http://localhost:9000/trips");
  const result = await res.json();

  trips = result.data;

  const select = document.getElementById("tripSelect");
  select.innerHTML = "";

  trips.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = `${t.id} — ${t.origin} → ${t.destination}`;
    select.appendChild(opt);
  });

  select.onchange = () => {
    currentTripId = select.value;
    loadCheckpoints(currentTripId);
  };

  if (trips.length) {
    currentTripId = trips[0].id;
    select.value = currentTripId;
    loadCheckpoints(currentTripId);
  }
}

// ================= LOAD CHECKPOINT =================
async function loadCheckpoints(tripId) {
  const res = await fetch(`http://localhost:9000/checkpoints/${tripId}`);
  const result = await res.json();

  checkpoints = result.data;

  renderCheckpoints(checkpoints);
  renderProgress();
}
function renderProgress() {
  const container = document.getElementById("progressLine");
  if (!container) return;

  container.innerHTML = "";

  const trip = trips.find(t => t.id === currentTripId);
  if (!trip) return;

  // 🟢 ORIGIN
  container.innerHTML += `
    <div class="step done">
      <div class="circle">🏁</div>
      <div class="label">${trip.origin}</div>
    </div>
  `;

  // 🔵 CHECKPOINTS
  checkpoints.forEach(cp => {
    let statusClass = "pending";

    if (cp.status === "DEPARTED") statusClass = "done";
    if (cp.status === "ARRIVED") statusClass = "active";

    container.innerHTML += `
      <div class="step ${statusClass}">
        <div class="circle">${cp.status === "DEPARTED" ? "✔" : ""}</div>
        <div class="label">${cp.location_name}</div>
      </div>
    `;
  });

  // 🔴 DESTINATION
  container.innerHTML += `
    <div class="step">
      <div class="circle">📍</div>
      <div class="label">${trip.destination}</div>
    </div>
  `;
}
function renderCheckpoints(data) {
  const container = document.getElementById("checkpoint-list");
  if (!container) return;

  container.innerHTML = "";

  data.forEach((cp, index) => {
    container.innerHTML += `
      <div style="padding:10px; border-bottom:1px solid #ddd;">
        <b>${cp.location_name}</b>
        <span style="margin-left:10px;">${cp.status}</span>

        ${
          currentUser.role !== "GUEST"
            ? `<button onclick="updateCheckpoint('${cp.id}', '${cp.status}', ${index})">
                ✔ Done
               </button>`
            : ""
        }
      </div>
    `;
  });
}

function setupAddCheckpoint() {
  const btn = document.getElementById("addCheckpointBtn");
  if (!btn) return;

  btn.onclick = async () => {

    const location = prompt("กรอกชื่อ location:");
    if (!location) return;

    await fetch("http://localhost:9000/checkpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_id: currentTripId,
        location_name: location
      })
    });

    loadCheckpoints(currentTripId);
  };
}
// ================= UPDATE =================
async function updateCheckpoint(id, status, index) {

  if (index > 0) {
    const prev = checkpoints[index - 1];
    if (prev.status !== "DEPARTED") {
      alert("❌ ต้องทำจุดก่อนหน้าให้เสร็จก่อน");
      return;
    }
  }

  await fetch(`http://localhost:9000/checkpoints/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "DEPARTED" })
  });

  await loadCheckpoints(currentTripId); // ✅ แก้แล้ว
}

// ✅ export ให้ app.js เรียกได้
window.initTracker = initTracker;

})();