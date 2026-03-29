const API = "http://localhost:9000/maintenance";
let editId = null;

// mock role (เปลี่ยนเป็นจาก login จริงได้)
const user = {
  role: "admin" // หรือ "dispatcher"
};

// // ซ่อนปุ่มถ้าไม่ใช่ admin
// if (user.role !== "admin") {
//   document.getElementById("addBtn").style.display = "none";
// }

// โหลดข้อมูล
async function loadData() {
  const res = await fetch(API);
  const json = await res.json();
  render(json.data);
}
// เปิด modal
function openModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("show");
}

// ปิด modal
function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("show");
}



function getStatus(item) {
  const today = new Date();
  const date = new Date(item.scheduled_at);

  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  // ✅ สำคัญ: เช็ค status จาก DB
  if (item.status === "COMPLETED") {
    return { class: "normal", text: "DONE" };
  }

  if (item.status === "IN_PROGRESS") {
    return { class: "scheduled", text: "IN PROGRESS" };
  }

  if (diff < 0) {
    return { class: "overdue", text: `${Math.abs(diff)}d overdue` };
  }

  return { class: "scheduled", text: `in ${diff}d` };
}

// render
function render(data) {
  const container = document.getElementById("maintenanceList");
  container.innerHTML = "";

  data.forEach(item => {
    const status = getStatus(item);

    const scheduled = new Date(item.scheduled_at)
      .toLocaleDateString("th-TH");

    const completed = item.completed_at && item.completed_at !== "0000-00-00"
  ? new Date(item.completed_at).toLocaleDateString("th-TH")
  : "-";

    const div = document.createElement("div");
    div.className = `card ${status.class}`;

    div.innerHTML = `
      <div class="left">
        <div class="title">${item.license_plate}</div>
        <div class="sub">${item.type} • ${item.technician}</div>

        <div class="dates">
          📅 นัดซ่อม: ${scheduled} <br>
          ✅ เสร็จ: ${completed}
        </div>
      </div>

      <div class="right">
        <div class="status">${item.status}</div>

        ${
          user.role === "admin"
            ? `<button class="edit-btn" onclick="edit('${item.id}')">✏️ Edit</button>`
            : ""
        }
      </div>
    `;

    container.appendChild(div);
  });
}

// open modal

function initMaintenance() {
  const addBtn = document.getElementById("addBtn");

  if (!addBtn) {
    console.error("❌ addBtn not found");
    return;
  }

  if (user.role !== "admin") {
    addBtn.style.display = "none";
  }

  addBtn.onclick = () => {
    console.log("🔥 ADD CLICKED"); // 👈 debug

    editId = null;

    document.getElementById("vehicle_id").value = "";
    document.getElementById("type").value = "";
    document.getElementById("technician").value = "";
    document.getElementById("scheduled_at").value = "";
    document.getElementById("completed_at").value = "";
    document.getElementById("status").value = "SCHEDULED";

    openModal();
  };

  loadData();
}


// save (create/update)
async function saveMaintenance() {
  const data = {
    vehicle_id: document.getElementById("vehicle_id").value.trim(),
    type: document.getElementById("type").value,
    technician: document.getElementById("technician").value,
    scheduled_at: document.getElementById("scheduled_at").value,
  completed_at: formatDateTime(document.getElementById("completed_at").value),
    status: document.getElementById("status").value,
    mileage_at_service: document.getElementById("mileage").value || null,
  cost_thb: document.getElementById("cost").value || null,
  notes: document.getElementById("notes").value || null
  };

  if (editId) {
    // ✏️ update
    await fetch(`${API}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } else {
    // ➕ create
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  closeModal();
  loadData();
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
setTimeout(() => {
  const statusEl = document.getElementById("status");

  if (statusEl) {
    statusEl.addEventListener("change", (e) => {
      if (e.target.value === "COMPLETED") {
        const now = new Date().toISOString().slice(0,16);
        document.getElementById("completed_at").value = now;
      }
    });
  }
}, 500);

document.addEventListener("click", (e) => {
  if (e.target.id === "modal") {
    closeModal();
  }
});


// edit
async function edit(id) {
  editId = id;

  const res = await fetch(API);
  const json = await res.json();

  const item = json.data.find(i => i.id === id);

  document.getElementById("vehicle_id").value = item.vehicle_id;
  document.getElementById("type").value = item.type;
  document.getElementById("technician").value = item.technician;
  document.getElementById("scheduled_at").value =
    item.scheduled_at.slice(0,16);

  const completedInput = document.getElementById("completed_at");

  if (item.completed_at) {
    const d = new Date(item.completed_at);

    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0,16);

    completedInput.value = local;
  } else {
    completedInput.value = "";
  }

  completedInput.disabled = false;

  document.getElementById("status").value = item.status;

  openModal();
}

// delete
async function removeItem(id) {
  if (!confirm("Delete?")) return;

  await fetch(`${API}/${id}`, {
    method: "DELETE"
  });

  loadData();
}
initMaintenance();