import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAdbajdKncmGkL5XV2WaXofWHpcbcOBWaE",
  authDomain: "yunior-chill-z0ne.firebaseapp.com",
  databaseURL: "https://yunior-chill-z0ne-default-rtdb.firebaseio.com",
  projectId: "yunior-chill-z0ne",
  storageBucket: "yunior-chill-z0ne.firebasestorage.app",
  messagingSenderId: "947317840264",
  appId: "1:947317840264:web:150402d90e493bc256c23d",
  measurementId: "G-T2EM26F6YP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username-input");
const pfpInput = document.getElementById("pfp-input");
const imageUpload = document.getElementById("image-upload"); // NEW

// ===== Local Storage for username + PFP =====
let currentUsername = localStorage.getItem("yc_username") || "";
usernameInput.value = currentUsername;

let currentPfpUrl = localStorage.getItem("yc_pfp") || "";
pfpInput.value = currentPfpUrl;

// ===== SEND MESSAGE =====
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  const file = imageUpload.files[0];

  if (!msg && !file) return; // require text or image

  let username = usernameInput.value.trim() || "Anon";
  let pfpUrl = pfpInput.value.trim() || "";

  localStorage.setItem("yc_username", username);
  localStorage.setItem("yc_pfp", pfpUrl);

  let imageUrl = "";

  // upload image if selected
  if (file) {
    const fileRef = sRef(storage, `chat-images/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    imageUrl = await getDownloadURL(fileRef);
  }

  push(ref(db, "messages"), {
    text: msg,
    timestamp: Date.now(),
    username,
    pfpUrl,
    imageUrl // NEW
  });

  input.value = "";
  imageUpload.value = ""; // reset file input
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
    msgDiv.style.flexDirection = "column"; // stack text + image

    // display uploaded image first if exists
    if (msg.imageUrl) {
      const img = document.createElement("img");
      img.src = msg.imageUrl;
      img.width = 150;
      img.style.borderRadius = "10px";
      img.style.marginBottom = "4px";
      msgDiv.appendChild(img);
    }

    const contentDiv = document.createElement("div");
    contentDiv.style.display = "flex";
    contentDiv.style.alignItems = "center";

    if (msg.pfpUrl) {
      const img = document.createElement("img");
      img.src = msg.pfpUrl;
      img.width = 40;
      img.height = 40;
      img.style.borderRadius = "50%";
      img.style.marginRight = "8px";
      contentDiv.appendChild(img);
    }

    const text = document.createElement("span");
    text.innerHTML = `<b>${msg.username || "Anon"}:</b> ${msg.text}`;
    contentDiv.appendChild(text);

    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
