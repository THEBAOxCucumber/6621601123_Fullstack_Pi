// =============================
// GLOBAL CHART INSTANCES
// =============================

console.log("Chart lib:", window.Chart);


window.statusChart = null;
window.distanceChart = null;


// =============================
// LOAD VEHICLE STATUS (PIE)
// =============================
async function loadVehicleStatusChart() {
  try {
    const canvas = document.getElementById('statusChart');
    if (!canvas) {
      console.error("❌ ไม่เจอ statusChart");
      return;
    }

    const ctx = canvas.getContext('2d');

    const res = await fetch('http://localhost:9000/vehicles/status-summary');
    const json = await res.json();

    console.log("🚗 status API:", json);

    if (!json.success) return;

    const data = json.data;

    // 🔥 destroy ก่อนสร้างใหม่
    if (window.statusChart) {
      window.statusChart.destroy();
    }

    window.statusChart = new Chart(ctx, {
        
      type: 'doughnut',
      data: {
        labels: ['ACTIVE', 'IDLE', 'MAINTENANCE', 'RETIRED'],
        datasets: [{
          data: [
            data.ACTIVE ?? 0,
            data.IDLE ?? 0,
            data.MAINTENANCE ?? 0,
            data.RETIRED ?? 0
          ],
          backgroundColor: [
            '#34d399',
            '#334155',
            '#f59e0b',
            '#f43f5e'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            labels: { color: '#94a3b8' }
          }
          
        }
        
      }
      
    });
    console.log("✅ statusChart created:", window.statusChart);

  } catch (err) {
    console.error("🔥 status chart error:", err);
  }
}


// =============================
// LOAD DISTANCE TREND (BAR)
// =============================
async function loadDistanceChart() {
  try {
    const res = await fetch('http://localhost:9000/trip-distance-trend');
    const json = await res.json();

    console.log("📊 raw:", json);

    if (!json.success) return;

    // 🔥 map เป็น object (เร็ว)
    const map = {};
    json.data.forEach(row => {
      const d = new Date(row.trip_date);
      const key = d.toISOString().split('T')[0];
      map[key] = Number(row.total_distance);
    });

    // 🔥 สร้าง 7 วันย้อนหลัง
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = d.toISOString().split('T')[0];

      labels.push(
        d.toLocaleDateString('th-TH', {
          weekday: 'short',
          timeZone: 'Asia/Bangkok'
        })
      );

      data.push(map[key] ?? 0);
    }

    console.log("labels:", labels);
    console.log("data:", data);

    const ctx = document.getElementById('distanceChart').getContext('2d');

    if (window.distanceChart) {
      window.distanceChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59,130,246,0.8)');
    gradient.addColorStop(1, 'rgba(59,130,246,0.1)');

    window.distanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Distance (km)',
          data,
          borderRadius: 8,
          backgroundColor: gradient
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(148,163,184,0.1)' }
          }
        }
      }
    });
    console.log("✅ distanceChart created:", window.distanceChart);

  } catch (err) {
    console.error("🔥 distance chart error:", err);
  }
}


function initDashboardCharts() {
  loadVehicleStatusChart();
  loadDistanceChart();
}