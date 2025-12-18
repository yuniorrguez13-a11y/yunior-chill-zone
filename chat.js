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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username-input");
const pfpInput = document.getElementById("pfp-input");

// ===== Local Storage for username + PFP =====
let currentUsername = localStorage.getItem("yc_username") || "";
usernameInput.value = currentUsername;

let currentPfpUrl = localStorage.getItem("yc_pfp") || "";
pfpInput.value = currentPfpUrl;

// ===== SEND MESSAGE =====
sendBtn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (!msg) return;

  let username = usernameInput.value.trim() || "Anon";
  let pfpUrl = pfpInput.value.trim() || "";

  localStorage.setItem("yc_username", username);
  localStorage.setItem("yc_pfp", pfpUrl);

  push(ref(db, "messages"), {
    text: msg,
    timestamp: Date.now(),
    username,
    pfpUrl
  });

  input.value = "";
});

// ===== LISTEN FOR MESSAGES =====
onValue(ref(db, "messages"), snapshot => {
  chatBox.innerHTML = "";
  const data = snapshot.val();
  if (!data) return;

  Object.values(data).forEach(msg => {
    const msgDiv = document.createElement("div");
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

let isAdmin = false;
const ADMIN_PASSWORD = "lolislol";

// Admin button click
document.getElementById("admin-zone-btn").addEventListener("click", () => {
  const pass = prompt("Enter admin password:");
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    alert("Admin mode activated 👑");
    addDeleteButtonsToAll();
  } else {
    alert("Wrong password 💀");
  }
});

// Add delete button to all existing messages
function addDeleteButtonsToAll() {
  const messages = document.querySelectorAll(".chat-message");
  messages.forEach((msg) => addDeleteButton(msg));
}

// Add delete button to a single message
function addDeleteButton(msgEl) {
  // Already has one? skip
  if (msgEl.querySelector(".delete-btn")) return;

  const delBtn = document.createElement("button");
  delBtn.textContent = "X";
  delBtn.className = "delete-btn";
  delBtn.style.marginLeft = "10px";
  delBtn.onclick = () => {
    msgEl.remove();
  };

  msgEl.appendChild(delBtn);
}

// Example function when sending messages
function sendMessage(username, message) {
  const chatBox = document.getElementById("chat-box");

  const msgEl = document.createElement("div");
  msgEl.className = "chat-message";
  msgEl.textContent = `${username}: ${message}`;

  chatBox.appendChild(msgEl);

  // Add delete button if admin
  if (isAdmin) addDeleteButton(msgEl);

  // Scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Hook your existing send button
document.getElementById("send-btn").addEventListener("click", () => {
  const username = document.getElementById("username-input").value || "Anon";
  const message = document.getElementById("msg-input").value;
  if (!message) return;

  sendMessage(username, message);
  document.getElementById("msg-input").value = "";
});
