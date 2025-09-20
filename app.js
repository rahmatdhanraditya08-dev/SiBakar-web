// 1) Import Firebase sebagai module
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// 2) Konfigurasi Firebase (ganti sesuai projectmu)
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://sibakar-2bf33-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const suhuRef = ref(db, "sensor/suhu");

const tempEl     = document.getElementById("temperature");
const exportBtn  = document.getElementById("exportBtn");
const tableBody  = document.querySelector("#logTable tbody");
const ctx        = document.getElementById("tempChart").getContext("2d");

// 3) Siapkan array untuk menyimpan log
const logs = [];

// 4) Inisiasi Chart.js
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Suhu (°C)",
      data: [],
      borderColor: "#d9534f",
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { display: true, title: { display: true, text: "Waktu" } },
      y: { display: true, title: { display: true, text: "°C" } }
    }
  }
});

// 5) Listener realtime untuk update UI, chart & log
onValue(suhuRef, snap => {
  const suhu = snap.val();
  if (suhu == null) return;

  // Tanggal & waktu sekarang
  const now    = new Date();
  const hari   = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal= now.toLocaleDateString("id-ID");
  const waktu  = now.toLocaleTimeString("id-ID");

  tempEl.textContent = `${suhu.toFixed(1)} °C`;

  // Tambah ke chart
  chart.data.labels.push(waktu);
  chart.data.datasets[0].data.push(suhu.toFixed(1));
  chart.update();

  // Tambah ke log array & tabel
  logs.push({ hari, tanggal, waktu, suhu: suhu.toFixed(1) });
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${hari}</td>
    <td>${tanggal}</td>
    <td>${waktu}</td>
    <td>${suhu.toFixed(1)}</td>
  `;
  tableBody.appendChild(row);
});

// 6) Export log ke Excel menggunakan SheetJS
exportBtn.addEventListener("click", () => {
  if (!logs.length) return alert("Tidak ada data untuk diexport.");

  // Bangun worksheet dari array log
  const ws = XLSX.utils.json_to_sheet(logs, {
    header: ["hari", "tanggal", "waktu", "suhu"]
  });
  // Buat workbook & lampirkan worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Log Suhu");
  // Download file
  XLSX.writeFile(wb, `Log_Suhu_SiBAKAR_${new Date().getTime()}.xlsx`);
});