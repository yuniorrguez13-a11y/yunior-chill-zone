import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// ====== YOUR FIREBASE CONFIG ======
const firebaseConfig = {
  apiKey: "AIzaSyCKEJtAl9qvD46tSJ2msJ3OjCCVQFfugd4",
  authDomain: "yunior-chill-zone.firebaseapp.com",
  databaseURL: "https://yunior-chill-zone-default-rtdb.firebaseio.com",
  projectId: "yunior-chill-zone",
  storageBucket: "yunior-chill-zone.firebasestorage.app",
  messagingSenderId: "688679116808",
  appId: "1:688679116808:web:af337276fd7b53bcf5b1bd",
  measurementId: "G-CT0EBC05GW"
};
// ====================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const btn = document.getElementById("send-btn");

// Send message
btn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (!msg) return;
  push(ref(db, "messages"), {
    text: msg,
    timestamp: Date.now()
  });
  input.value = "";
});

// Listen for new messages
onValue(ref(db, "messages"), (snapshot) => {
  chatBox.innerHTML = "";
  const data = snapshot.val();
  if (!data) return;
  for (let id in data) {
    const p = document.createElement("p");
    p.textContent = data[id].text;
    chatBox.appendChild(p);
  }
});

