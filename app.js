// 1) Import modul Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpBVzHfQRENwdlF9LkVwAGq0_uXiZs-aA",
  authDomain: "sibakar-2bf33.firebaseapp.com",
  projectId: "sibakar-2bf33",
  storageBucket: "sibakar-2bf33.firebasestorage.app",
  messagingSenderId: "362172152987",
  appId: "1:362172152987:web:f8866fbe15934012799a3e"
};




// 3) Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const suhuRef = ref(db, "sensor/suhu");

const tempEl   = document.getElementById("temperature");
const statusEl = document.getElementById("status");

// 4) Listener realtime
onValue(suhuRef, (snap) => {
  const suhu = snap.val();
  tempEl.innerHTML = suhu.toFixed(1) + " °C";

  if (suhu > 40) {
    statusEl.textContent = "Status: PANAS";
    statusEl.classList.add("hot");
    statusEl.classList.remove("normal");
  } else {
    statusEl.textContent = "Status: NORMAL";
    statusEl.classList.add("normal");
    statusEl.classList.remove("hot");
  }
}, (err) => {
  console.error("Error baca data:", err);
});