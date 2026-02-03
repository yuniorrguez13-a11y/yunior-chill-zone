// ===== Supabase Config =====
const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM Elements =====
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username-input");
const pfpInput = document.getElementById("pfp-input");
const imageUpload = document.getElementById("image-upload");
const safeModeToggle = document.getElementById("safe-mode-toggle");

// ===== Local Storage =====
let currentUsername = localStorage.getItem("yc_username") || "";
usernameInput.value = currentUsername;

let currentPfpUrl = localStorage.getItem("yc_pfp") || "";
pfpInput.value = currentPfpUrl;

let safeModeEnabled = localStorage.getItem("yc_safe_mode") === "true";
safeModeToggle.checked = safeModeEnabled;

// ===== Safe Mode Filter =====
const blockedWords = [
  "fuck","shit","bitch","asshole","bastard","dick","pussy","cunt","slut","whore",
  "nigger","nigga","fag","faggot","kike","spic","chink"
];

const shouldHideMessage = (text = "") => {
  if (!safeModeEnabled) return false;
  const normalized = text.toLowerCase();
  return blockedWords.some(word => normalized.includes(word));
};

safeModeToggle.addEventListener("change", () => {
  safeModeEnabled = safeModeToggle.checked;
  localStorage.setItem("yc_safe_mode", safeModeEnabled);
  renderMessages();
});

// ===== Send Message =====
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  const file = imageUpload.files[0];
  if (!msg && !file) return;

  const username = usernameInput.value.trim() || "Anon";
  const pfpUrl = pfpInput.value.trim() || "";

  localStorage.setItem("yc_username", username);
  localStorage.setItem("yc_pfp", pfpUrl);

  let imageUrl = "";
  if (file) {
    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(`public/${Date.now()}_${file.name}`, file);
    if (!error) {
      const { publicUrl } = supabase.storage
        .from("chat-images")
        .getPublicUrl(data.path);
      imageUrl = publicUrl;
    }
  }

  await supabase.from("messages").insert([
    { username, pfp_url: pfpUrl, text: msg, image_url: imageUrl, timestamp: Date.now() }
  ]);

  input.value = "";
  imageUpload.value = "";
});

// ===== Render Messages =====
async function renderMessages() {
  const { data } = await supabase.from("messages")
    .select("*")
    .order("timestamp", { ascending: true });

  chatBox.innerHTML = "";

  data.forEach(msg => {
    if (shouldHideMessage(msg.text)) return;

    const msgDiv = document.createElement("div");
    msgDiv.style.display = "flex";
    msgDiv.style.flexDirection = "column";
    msgDiv.style.marginBottom = "8px";

    if (msg.image_url) {
      const img = document.createElement("img");
      img.src = msg.image_url;
      img.width = 150;
      img.style.borderRadius = "10px";
      img.style.marginBottom = "4px";
      msgDiv.appendChild(img);
    }

    const contentDiv = document.createElement("div");
    contentDiv.style.display = "flex";
    contentDiv.style.alignItems = "center";

    if (msg.pfp_url) {
      const pfpImg = document.createElement("img");
      pfpImg.src = msg.pfp_url;
      pfpImg.width = 40;
      pfpImg.height = 40;
      pfpImg.style.borderRadius = "50%";
      pfpImg.style.marginRight = "8px";
      contentDiv.appendChild(pfpImg);
    }

    const text = document.createElement("span");
    text.innerHTML = `<b>${msg.username || "Anon"}:</b> ${msg.text}`;
    contentDiv.appendChild(text);

    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Realtime Subscription =====
supabase
  .channel("public:messages")
  .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
    renderMessages();
  })
  .subscribe();

// ===== Initial Render =====
renderMessages();
