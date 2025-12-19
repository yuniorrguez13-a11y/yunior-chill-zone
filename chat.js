import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyCKEJtAl9qvD46tSJ2msJ3OjCCVQFfugd4",
  authDomain: "yunior-chill-zone.firebaseapp.com",
  databaseURL: "https://yunior-chill-zone-default-rtdb.firebaseio.com",
  projectId: "yunior-chill-zone",
  storageBucket: "yunior-chill-zone.firebasestorage.app",
  messagingSenderId: "688679116808",
  appId: "1:688679116808:web:af337276fd7b53bcf5b1bd"
};

// ===== INITIALIZE FIREBASE =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== DOM ELEMENTS =====
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username-input");
const pfpInput = document.getElementById("pfp-input");
const adminBtn = document.getElementById("admin-zone-btn");

// ===== LOCAL STORAGE =====
let currentUsername = localStorage.getItem("yc_username") || "";
usernameInput.value = currentUsername;

let currentPfpUrl = localStorage.getItem("yc_pfp") || "";
pfpInput.value = currentPfpUrl;

// ===== ADMIN =====
let isAdmin = false;
const ADMIN_PASSWORD = "lolislol";

adminBtn.addEventListener("click", () => {
  const pass = prompt("Enter admin password:");
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    alert("Admin mode activated 👑");
  } else {
    alert("Wrong password 💀");
  }
});

// ===== SEND MESSAGE =====
sendBtn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (!msg) return;

  const username = usernameInput.value.trim() || "Anon";
  const pfpUrl = pfpInput.value.trim() || "";

  localStorage.setItem("yc_username", username);
  localStorage.setItem("yc_pfp", pfpUrl);

  // Push to Firebase
  push(ref(db, "messages"), { text: msg, timestamp: Date.now(), username, pfpUrl });

  // Update DOM
  const msgDiv = document.createElement("div");
  msgDiv.className = "chat-message";
  if (pfpUrl) {
    const img = document.createElement("img");
    img.src = pfpUrl;
    img.width = 40;
    img.height = 40;
    img.style.borderRadius = "50%";
    img.style.marginRight = "8px";
    msgDiv.appendChild(img);
  }
  const text = document.createElement("span");
  text.innerHTML = `<b>${username}:</b> ${msg}`;
  msgDiv.appendChild(text);

  if (isAdmin) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => msgDiv.remove();
    msgDiv.appendChild(delBtn);
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  input.value = "";
});

// ===== LISTEN FOR FIREBASE MESSAGES =====
onValue(ref(db, "messages"), snapshot => {
  chatBox.innerHTML = "";
  const data = snapshot.val();
  if (!data) return;

  Object.values(data).forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message";
    msgDiv.style.display = "flex";
    msgDiv.style.alignItems = "center";
    msgDiv.style.marginBottom = "8px";

    if (msg.pfpUrl) {
      const img = document.createElement("img");
      img.src = msg.pfpUrl;
      img.width = 40;
      img.height = 40;
      img.style.borderRadius = "50%";
      img.style.marginRight = "8px";
      msgDiv.appendChild(img);
    }

    const text = document.createElement("span");
    text.innerHTML = `<b>${msg.username || "Anon"}:</b> ${msg.text}`;
    msgDiv.appendChild(text);

    chatBox.appendChild(msgDiv);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
