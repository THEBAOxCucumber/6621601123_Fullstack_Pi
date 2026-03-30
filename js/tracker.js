(function () {

let trips = [];
let currentTripId = null;
let checkpoints = [];
let isUpdating = false;
// ✅ ไม่ชนอีกแน่นอน
const currentUser = window.auth?.getUser?.() || { role: "GUEST" };

const params = new URLSearchParams(window.location.search);
const tripId = params.get("trip_id");



// ================= INIT =================
function initTracker() {

  setInterval(async () => {
  if (!currentTripId || isUpdating) return;

  // await autoUpdateCheckpoint(); // 🔥 ทำก่อน
  await loadCheckpoints(currentTripId); // แล้วค่อย render
}, 3000);
  if (currentUser.role === "GUEST") {
    document.getElementById("addCheckpointBtn").style.display = "none";
  }

  setupAddCheckpoint();
  setupFinishTrip();
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

  const exists = trips.find(t => t.id === tripId);

if (tripId && exists) {
  currentTripId = tripId;
} else if (trips.length) {
  currentTripId = trips[0].id;
}

select.value = currentTripId;
loadCheckpoints(currentTripId);
}

function renderTripInfo() {
  const trip = trips.find(t => t.id === currentTripId);
  if (!trip) return;

  document.getElementById("vehicle").innerText = trip.vehicle_id || "-";
  document.getElementById("driver").innerText = trip.driver_id || "-";
  document.getElementById("route").innerText = `${trip.origin} → ${trip.destination}`;
  document.getElementById("distance").innerText = trip.distance_km + " km";
  document.getElementById("cargo").innerText = trip.cargo_type || "-";
}

function renderCheckpoints(data) {
  const container = document.getElementById("checkpoint-list");
  if (!container) return;

  container.innerHTML = "";

  data.forEach((cp, index) => {

    const disabled = false;

    container.innerHTML += `
      <div style="padding:10px; border-bottom:1px solid #ddd;">
       <b>${index + 1}. ${cp.location_name}</b>
<div style="font-size:12px;color:#888;">
  ${
    cp.arrived_at
      ? new Date(cp.arrived_at).toLocaleString()
      : "ยังไม่ถึง"
  }
</div>
       <span style="
  margin-left:10px;
  color:${
    cp.status === "ARRIVED" ? "green" : "gray"
  };
">
  ${
    cp.status === "ARRIVED" ? "ARRIVED" : "PENDING"
  }
</span>

        ${
          currentUser.role !== "GUEST"
            ? `<button 
                ${disabled ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}
                onclick="updateCheckpoint('${cp.id}', ${index})">
                ✔ Done
               </button>`
            : ""
        }
      </div>
    `;
  });
}

// ================= LOAD CHECKPOINT =================
async function loadCheckpoints(tripId) {
  try {
    const res = await fetch(`http://localhost:9000/checkpoints/${tripId}`);
    const result = await res.json();

    checkpoints = result.data.sort((a, b) => a.sequence - b.sequence);

    renderCheckpoints(checkpoints);
    renderProgress();
    renderTripInfo();

    if (checkpoints.length > 0 &&
    checkpoints.every(cp => cp.status === "ARRIVED")) {
      console.log("🚚 ถึงปลายทางแล้ว");
    }

  } catch (err) {
    console.error("โหลด checkpoint ไม่ได้", err);
  }


}
function renderProgress() {
  const container = document.getElementById("progressLine");
  if (!container) return;

  container.innerHTML = "";

  const trip = trips.find(t => t.id === currentTripId);
  if (!trip) return;

 const started = checkpoints.some(cp => cp.status !== "PENDING");
  const last = checkpoints[checkpoints.length - 1];

const finished = trip.status === "COMPLETED";
  // 🟢 ORIGIN
  container.innerHTML += `
    <div class="step ${started ? "done" : "active"}">
      <div class="circle">🏁</div>
      <div class="label">${trip.origin}</div>
    </div>
  `;

  // 🔵 CHECKPOINTS
  checkpoints.forEach(cp => {
    let statusClass = "pending";

   if (cp.status === "ARRIVED") {
  statusClass = "done";
} else {
  statusClass = "pending";
}

    container.innerHTML += `
      <div class="step ${statusClass}">
        <div class="circle">
          ${cp.status === "ARRIVED" ? "✔" : ""}
        </div>
        <div class="label">${cp.location_name}</div>
      </div>
    `;
  });

  // 🔴 DESTINATION

container.innerHTML += `
  <div class="step ${finished ? "done" : ""}">
    <div class="circle">📍</div>
    <div class="label">${trip.destination}</div>
  </div>
`;

  const totalSteps = checkpoints.length + 1; // + destination
const doneSteps = checkpoints.filter(c => c.status === "ARRIVED").length;

let percent = (doneSteps / totalSteps) * 100;

if (trip.status === "COMPLETED") {
  percent = 100;
}

  container.style.setProperty("--progress", percent + "%");
}

function setupAddCheckpoint() {

  document.getElementById("addCheckpointBtn").onclick = () => {
    document.getElementById("checkpointModal").classList.remove("hidden");
  };

  document.getElementById("closeCpBtn").onclick = () => {
    document.getElementById("checkpointModal").classList.add("hidden");
  };

}
// ================= UPDATE =================
document.getElementById("saveCpBtn").onclick = async () => {
  const location = document.getElementById("cpLocation").value;
  const purpose = document.getElementById("cpPurpose").value;

  if (!location) {
    alert("กรอก location");
    return;
  }

  await fetch("http://localhost:9000/checkpoints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + window.auth.getToken()
    },
    body: JSON.stringify({
      trip_id: currentTripId,
      location_name: location,
      purpose: purpose
    })
  });

  document.getElementById("checkpointModal").classList.add("hidden");

  await loadCheckpoints(currentTripId);
};
async function updateCheckpoint(id,index) {
  const cp = checkpoints[index];
if (!cp) return;
  // if (index > 0) {
  //   const prev = checkpoints[index - 1];
  //     if (prev.status !== "ARRIVED") {
  //     alert("❌ ต้องออกจากจุดก่อนหน้าให้เสร็จก่อน");
  //     return;
  //   }
  // }

  await fetch(`http://localhost:9000/checkpoints/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ARRIVED" })
  });

  await loadCheckpoints(currentTripId);
}
window.updateCheckpoint = updateCheckpoint;
window.autoUpdateCheckpoint = () => {};

window.initTracker = initTracker;

function setupFinishTrip() {
  const btn = document.getElementById("finishTripBtn");
  if (!btn) return;

  // GUEST กดไม่ได้
  if (currentUser.role === "GUEST") {
    btn.style.display = "none";
    return;
  }

  btn.onclick = async () => {
  if (!checkpoints.length) return;

  const last = checkpoints[checkpoints.length - 1];

  // 1️⃣ mark checkpoint สุดท้าย
  await fetch(`http://localhost:9000/checkpoints/${last.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ARRIVED" })
  });

  // 🔥 2️⃣ mark trip = COMPLETED (สำคัญมาก)
  await fetch(`http://localhost:9000/trips/${currentTripId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "COMPLETED",
      ended_at: new Date().toISOString()
    })
  });

  // 🔥 3️⃣ reload trips (สำคัญมาก)
  await loadTrips();

  // 🔥 4️⃣ reload checkpoints
  await loadCheckpoints(currentTripId);

  alert("🚚 ถึงปลายทางแล้ว");
};
}

})();