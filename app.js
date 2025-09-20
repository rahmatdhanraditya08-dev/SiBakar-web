import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCpBVzHfQRENwdlF9LkVwAGq0_uXiZs-aA",
  databaseURL: "https://sibakar-2bf33-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const tempEl = document.getElementById("temperature");
const mq2El = document.getElementById("mq2");
const mq7El = document.getElementById("mq7");
const logTable = document.querySelector("#logTable tbody");
const exportBtn = document.getElementById("exportBtn");

// Chart setup
const tempChart = new Chart(document.getElementById("tempChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Suhu",
      data: [],
      borderColor: "#e53935",
      backgroundColor: "rgba(229,57,53,0.1)",
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});

const mq2Chart = new Chart(document.getElementById("mq2Chart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "MQ2",
      data: [],
      borderColor: "#fb8c00",
      backgroundColor: "rgba(251,140,0,0.1)",
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});

const mq7Chart = new Chart(document.getElementById("mq7Chart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "MQ7",
      data: [],
      borderColor: "#1e88e5",
      backgroundColor: "rgba(30,136,229,0.1)",
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});

// History for insight
const history = {
  suhu: [],
  mq2: [],
  mq7: []
};

// Insight generator
function generateInsight(arr, label, threshold) {
  if (arr.length < 2) return `Belum cukup data untuk analisis.`;
  const latest = arr[arr.length - 1];
  const prev = arr[arr.length - 2];
  const delta = latest - prev;
  const trend = delta > 0 ? "meningkat" : delta < 0 ? "menurun" : "stabil";
  const status = latest > threshold ? "⚠️ Melebihi ambang!" : "✅ Normal";
  return `${label} ${trend} (${delta.toFixed(1)}), ${status}`;
}

// Realtime listener
onValue(ref(db, "/sensor"), snapshot => {
  const data = snapshot.val();
  const suhu = data.suhu || 0;
  const mq2 = data.gas_mq2 || 0;
  const mq7 = data.gas_mq7 || 0;

  // Update UI
  tempEl.textContent = `${suhu.toFixed(1)} °C`;
  mq2El.textContent = `${mq2.toFixed(1)} ppm`;
  mq7El.textContent = `${mq7.toFixed(1)} ppm`;

  // Timestamp
  const now = new Date();
  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = now.toLocaleDateString("id-ID");
  const waktu = now.toLocaleTimeString("id-ID");

  // Update charts
  tempChart.data.labels.push(waktu);
  tempChart.data.datasets[0].data.push(suhu);
  tempChart.update();

  mq2Chart.data.labels.push(waktu);
  mq2Chart.data.datasets[0].data.push(mq2);
  mq2Chart.update();

  mq7Chart.data.labels.push(waktu);
  mq7Chart.data.datasets[0].data.push(mq7);
  mq7Chart.update();

  // Save history
  history.suhu.push(suhu);
  history.mq2.push(mq2);
  history.mq7.push(mq7);

  // Update insights
  document.getElementById("insight-temp").textContent =
    "Insight suhu: " + generateInsight(history.suhu, "Suhu", 40);
  document.getElementById("insight-mq2").textContent =
    "Insight MQ2: " + generateInsight(history.mq2, "Gas MQ2", 300);
  document.getElementById("insight-mq7").textContent =
    "Insight MQ7: " + generateInsight(history.mq7, "Gas MQ7", 100);

  // Update table
  const row = document.createElement("tr");
  row.innerHTML = `<td>${hari}</td><td>${tanggal}</td><td>${waktu}</td><td>${suhu.toFixed(1)}</td><td>${mq2.toFixed(1)}</td><td>${mq7.toFixed(1)}</td>`;
  logTable.appendChild(row);
});

// Export to Excel
exportBtn.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const rows = [["Hari", "Tanggal", "Waktu", "Suhu (°C)", "MQ2 (ppm)", "MQ7 (ppm)"]];

  document.querySelectorAll("#logTable tbody tr").forEach(tr => {
    const cols = Array.from(tr.children).map(td => td.textContent);
    rows.push(cols);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Log Sensor");
  XLSX.writeFile(wb, "SiBAKAR_Log.xlsx");
});