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
  data: { labels: [], datasets: [{ label: "Suhu (°C)", data: [], borderColor: "#d32f2f", fill: false }] },
  options: { responsive: true }
});

const mq2Chart = new Chart(document.getElementById("mq2Chart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "MQ2 (ppm)", data: [], borderColor: "#f57c00", fill: false }] },
  options: { responsive: true }
});

const mq7Chart = new Chart(document.getElementById("mq7Chart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "MQ7 (ppm)", data: [], borderColor: "#1976d2", fill: false }] },
  options: { responsive: true }
});

// Realtime listener
onValue(ref(db, "/sensor"), snapshot => {
  const data = snapshot.val();
  const suhu = data.suhu || 0;
  const mq2 = data.gas_mq2 || 0;
  const mq7 = data.gas_mq7 || 0;

  // Update UI
  tempEl.textContent = `Suhu: ${suhu.toFixed(1)} °C`;
  mq2El.textContent = `MQ2: ${mq2.toFixed(1)} ppm`;
  mq7El.textContent = `MQ7: ${mq7.toFixed(1)} ppm`;

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