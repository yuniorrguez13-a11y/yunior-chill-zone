const _0x5eaa7f = _0x49a7;

(function (_0x480e5b, _0x2ebda6) {
  const _0x17b996 = _0x49a7;
  const _0x4bd209 = _0x480e5b();

  while (!![]) {
    try {
      const _0x4c696d =
        -parseInt(_0x17b996(0x145)) / 0x1 +
        -parseInt(_0x17b996(0x136)) / 0x2 +
        -parseInt(_0x17b996(0x11a)) / 0x3 *
          (-parseInt(_0x17b996(0x139)) / 0x4) +
        parseInt(_0x17b996(0x149)) / 0x5 -
        parseInt(_0x17b996(0x142)) / 0x6 +
        parseInt(_0x17b996(0x12e)) / 0x7 -
        parseInt(_0x17b996(0x12d)) / 0x8 *
          (parseInt(_0x17b996(0x14c)) / 0x9);

      if (_0x4c696d === _0x2ebda6) break;
      else _0x4bd209.push(_0x4bd209.shift());
    } catch (_0x56110f) {
      _0x4bd209.push(_0x4bd209.shift());
    }
  }
})(_0x2bbd, 0x83648);

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

function _0x49a7(_0xee0b19, _0x30434d) {
  _0xee0b19 = _0xee0b19 - 0x11a;
  const _0x2bbd6f = _0x2bbd();
  let _0x49a73c = _0x2bbd6f[_0xee0b19];
  return _0x49a73c;
}

import {
  getDatabase,
  ref,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: _0x5eaa7f(0x121),
  authDomain: _0x5eaa7f(0x14d),
  databaseURL: "https://yunior-chill-zone-default-rtdb.firebaseio.com",
  projectId: "yunior-chill-zone",
  storageBucket: "yunior-chill-zone.firebasestorage.app",
  messagingSenderId: _0x5eaa7f(0x13c),
  appId: _0x5eaa7f(0x13d),
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const chatBox = document.getElementById("chat-box");
const input = document[_0x5eaa7f(0x124)](_0x5eaa7f(0x130));
const sendBtn = document.getElementById(_0x5eaa7f(0x151));
const usernameInput = document[_0x5eaa7f(0x124)](_0x5eaa7f(0x125));
const pfpInput = document[_0x5eaa7f(0x124)](_0x5eaa7f(0x126));

let currentUsername =
  localStorage.getItem(_0x5eaa7f(0x14f)) || "";

usernameInput.value = currentUsername;

let currentPfpUrl =
  localStorage.getItem("yc_pfp") || "";

pfpInput.value = currentPfpUrl;

sendBtn.addEventListener(_0x5eaa7f(0x146), () => {
  const _0x102ecc = _0x5eaa7f;
  const _0x5b7d92 = input.value.trim();

  if (!_0x5b7d92) return;

  let _0x3f2cf4 =
    usernameInput.value.trim() || "Anon";
  let _0xbc3a1f =
    pfpInput.value.trim() || "";

  localStorage.setItem(_0x102ecc(0x14f), _0x3f2cf4);
  localStorage.setItem("yc_pfp", _0xbc3a1f);

  push(ref(db, _0x102ecc(0x127)), {
    text: _0x5b7d92,
    timestamp: Date.now(),
    username: _0x3f2cf4,
    pfpUrl: _0xbc3a1f,
  });

  input.value = "";
});

onValue(ref(db, _0x5eaa7f(0x127)), (_0x13ca77) => {
  const _0x5102ed = _0x5eaa7f;
  chatBox.innerHTML = "";

  const _0x339dbf = _0x13ca77.val();
  if (!_0x339dbf) return;

  Object.values(_0x339dbf).forEach((_0x24c609) => {
    const _0x539d52 = _0x5102ed;

    const _0x2d8de3 = document.createElement("div");
    _0x2d8de3.style.display = "flex";
    _0x2d8de3.style.alignItems = "center";
    _0x2d8de3.style.marginBottom = "8px";

    if (_0x24c609.pfpUrl) {
      const _0x4d80ba = document.createElement("img");
      _0x4d80ba.src = _0x24c609.pfpUrl;
      _0x4d80ba.width = 40;
      _0x4d80ba.height = 40;
      _0x4d80ba.style.borderRadius = "50%";
      _0x4d80ba.style.marginRight = "8px";
      _0x2d8de3.appendChild(_0x4d80ba);
    }

    const _0x3d318f = document.createElement("span");
    _0x3d318f.innerHTML =
      "<b>" +
      (_0x24c609.username || "Anon") +
      ":</b> " +
      _0x24c609.text;

    _0x2d8de3.appendChild(_0x3d318f);
    chatBox.appendChild(_0x2d8de3);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ===== ADMIN ===== */

let isAdmin = false;
const ADMIN_PASSWORD = _0x5eaa7f(0x144);

document
  .getElementById(_0x5eaa7f(0x13f))
  .addEventListener("click", () => {
    const _0x1ee5b1 = _0x5eaa7f;
    const _0x49fc9e = prompt("Enter admin password:");

    if (_0x49fc9e === ADMIN_PASSWORD) {
      isAdmin = true;
      alert(_0x1ee5b1(0x148));
      enableAdminControls();
    } else {
      alert("Wrong password 💀");
    }
  });

function enableAdminControls() {
  const _0x3e7a34 = _0x5eaa7f;
  const _0x43f9ab =
    document.querySelectorAll(".chat-message");

  _0x43f9ab.forEach(addDeleteButton);
}

function addDeleteButton(_0x10547d) {
  const _0x5b5d20 = _0x5eaa7f;

  if (_0x10547d.querySelector(".delete-btn")) return;

  const _0x41f903 = document.createElement("button");
  _0x41f903.textContent = "X";
  _0x41f903.className = "delete-btn";

  _0x41f903.onclick = () => {
    _0x10547d.remove();
  };

  _0x10547d.appendChild(_0x41f903);
}
