import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

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
// ====================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username-input");
const pfpInput = document.getElementById("pfp-input");

// ===== Local Storage to remember username + pfp =====
let currentUsername = localStorage.getItem("yc_username") || "";
usernameInput.value = currentUsername;

let currentPfpUrl = localStorage.getItem("yc_pfp") || "";

// ===== SEND MESSAGE =====
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if(!msg) return;

  let username = usernameInput.value.trim() || "Anon";
  let pfpUrl = currentPfpUrl;

  // upload new pfp if selected
  if(pfpInput.files.length > 0){
    const file = pfpInput.files[0];
    const fileRef = sRef(storage, `pfps/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    pfpUrl = await getDownloadURL(fileRef);

    // save to localStorage
    localStorage.setItem("yc_pfp", pfpUrl);
  }

  // save username to localStorage
  localStorage.setItem("yc_username", username);

  push(ref(db, "messages"), {
    text: msg,
    timestamp: Date.now(),
    username,
    pfpUrl
  });

  input.value = "";
});

// ===== LISTEN FOR MESSAGES =====
onValue(ref(db, "messages"), (snapshot) => {
  chatBox.innerHTML = "";
  const data = snapshot.val();
  if(!data) return;

  Object.values(data).forEach(msg => {
    const msgDiv = document.createElement("div");
    msgDiv.style.display = "flex";
    msgDiv.style.alignItems = "center";
    msgDiv.style.marginBottom = "8px";

    // profile pic
    if(msg.pfpUrl){
      const img = document.createElement("img");
      img.src = msg.pfpUrl;
      img.width = 40;
      img.height = 40;
      img.style.borderRadius = "50%";
      img.style.marginRight = "8px";
      msgDiv.appendChild(img);
    }

    // username + text
    const text = document.createElement("span");
    text.innerHTML = `<b>${msg.username}:</b> ${msg.text}`;
    msgDiv.appendChild(text);

    chatBox.appendChild(msgDiv);
  });

  // auto scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
});



