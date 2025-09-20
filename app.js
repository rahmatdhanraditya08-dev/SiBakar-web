import { initializeApp } 
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue }
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCpBVzHfQRENwdlF9LkVwAGq0_uXiZs-aA",
  databaseURL: "https://sibakar-2bf33-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const tempEl       = document.getElementById("temperature");
const mq2El        = document.getElementById("mq2");
const mq7El        = document.getElementById("mq7");
const apiEl        = document.getElementById("apiStatus");
const relay1El     = document.getElementById("relay1Status");
const relay2El     = document.getElementById("relay2Status");
const relay3El     = document.getElementById("relay3Status");
const relay4El     = document.getElementById("relay4Status");
const logTable     = document.querySelector("#logTable tbody");
const exportBtn    = document.getElementById("exportBtn");
const banner       = document.getElementById("fireBanner");
const apiCard      = document.querySelector(".sensor-card.api");

// Chart setup (sama seperti sebelumnya)
function makeChart(ctx, color) {
  return new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ data: [], borderColor: color, tension: 0.3, pointRadius: 0 }] },
    options: { plugins:{ legend:{ display:false }}, scales:{ x:{display:false}, y:{display:false}}}
  });
}
const tempChart = makeChart(document.getElementById("tempChart"), "#e53935");
const mq2Chart  = makeChart(document.getElementById("mq2Chart"),  "#fb8c00");
const mq7Chart  = makeChart(document.getElementById("mq7Chart"),  "#1e88e5");

// History for insight
const history = { suhu: [], mq2: [], mq7: [] };
function genInsight(arr, label, thresh) {
  if (arr.length < 2) return "Belum cukup data";
  const last = arr[arr.length-1], prev = arr[arr.length-2];
  const delta = (last - prev).toFixed(1);
  const trend = delta>0?"meningkat":delta<0?"menurun":"stabil";
  const status = last>thresh?"⚠️ Melebihi":"✅ Normal";
  return `${label} ${trend} (${delta}), ${status}`;
}

// Setup Notification
if ("Notification" in window) Notification.requestPermission();
function notifyFire() {
  if (Notification.permission === "granted") {
    new Notification("🔥 SiBAKAR Alert", { body: "Api terdeteksi!" });
  }
}

// Real-time listener
onValue(ref(db, "/sensor"), snapshot => {
  const raw  = snapshot.val() || {};
  const suhu = raw.suhu    ?? 0;
  const mq2  = raw.gas_mq2 ?? 0;
  const mq7  = raw.gas_mq7 ?? 0;
  const api  = raw.api     ?? false;
  const r1   = raw.relay1  ?? false;
  const r2   = raw.relay2  ?? false;
  const r3   = raw.relay3  ?? false;
  const r4   = raw.relay4  ?? false;

  // Update teks
  tempEl.textContent   = `${suhu.toFixed(1)} °C`;
  mq2El.textContent    = `${mq2.toFixed(1)} ppm`;
  mq7El.textContent    = `${mq7.toFixed(1)} ppm`;
  apiEl.textContent    = api ? "API" : "AMAN";
  relay1El.textContent = `R1: ${r1? "ON":"OFF"}`;
  relay2El.textContent = `R2: ${r2? "ON":"OFF"}`;
  relay3El.textContent = `R3: ${r3? "ON":"OFF"}`;
  relay4El.textContent = `R4: ${r4? "ON":"OFF"}`;

  // Banner & card Api
  apiCard.classList.toggle("danger", api);
  banner.classList.toggle("show", api);
  if (api) notifyFire();

  // Timestamp
  const waktu = new Date().toLocaleTimeString("id-ID");

  // Update charts
  [[tempChart, suhu],[mq2Chart, mq2],[mq7Chart, mq7]].forEach(([c,v])=>{
    c.data.labels.push(waktu);
    c.data.datasets[0].data.push(v);
    c.update();
  });

  // Update insights
  history.suhu.push(suhu);
  history.mq2.push(mq2);
  history.mq7.push(mq7);
  document.getElementById("insight-temp").textContent =
    "Insight suhu: " + genInsight(history.suhu, "Suhu", 40);
  document.getElementById("insight-mq2").textContent =
    "Insight MQ2: " + genInsight(history.mq2, "Gas MQ2", 300);
  document.getElementById("insight-mq7").textContent =
    "Insight MQ7: " + genInsight(history.mq7, "Gas MQ7", 100);

  // Tambah baris log
  const row  = document.createElement("tr");
  const hari = new Date().toLocaleDateString("id-ID", { weekday:"long" });
  const tgl  = new Date().toLocaleDateString("id-ID");
  const wrt  = new Date().toLocaleTimeString("id-ID");
  row.innerHTML = `
    <td>${hari}</td>
    <td>${tgl}</td>
    <td>${wrt}</td>
    <td>${suhu.toFixed(1)}</td>
    <td>${mq2.toFixed(1)}</td>
    <td>${mq7.toFixed(1)}</td>
    <td>${api? "API":"AMAN"}</td>
    <td>${r1? "1":"0"}</td>
    <td>${r2? "1":"0"}</td>
    <td>${r3? "1":"0"}</td>
    <td>${r4? "1":"0"}</td>
  `;
  logTable.appendChild(row);
});

// Export ke Excel
exportBtn.addEventListener("click", () => {
  const wb   = XLSX.utils.book_new();
  const rows = [[
    "Hari","Tanggal","Waktu",
    "Suhu (°C)","MQ2 (ppm)","MQ7 (ppm)",
    "Api","R1","R2","R3","R4"
  ]];
  document.querySelectorAll("#logTable tbody tr").forEach(tr => {
    rows.push(Array.from(tr.children).map(td => td.textContent));
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "LogSensor");
  XLSX.writeFile(wb, "SiBAKAR_Log.xlsx");
});