<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/supabase.min.js"></script>
<script>
window.addEventListener("load", () => {
  // ===== Supabase Config =====
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("Supabase loaded:", supabase);

  // ===== DOM Elements =====
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("msg-input");
  const sendBtn = document.getElementById("send-btn");
  const usernameInput = document.getElementById("username-input");
  const pfpInput = document.getElementById("pfp-input");
  const imageUpload = document.getElementById("image-upload");
  const safeModeToggle = document.getElementById("safe-mode-toggle");

  // ===== Local Storage & Safe Mode =====
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
    let pfpUrl = pfpInput.value.trim() || "";

    localStorage.setItem("yc_username", username);
    localStorage.setItem("yc_pfp", pfpUrl);

    let imageUrl = "";

    if (file) {
      // Upload message image to Supabase storage
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(`public/${Date.now()}_${file.name}`, file);

      if (!error) {
        const { publicUrl } = supabase.storage
          .from("chat-images")
          .getPublicUrl(data.path);
        imageUrl = publicUrl;
      } else {
        console.error("Storage upload error:", error.message);
      }
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          { username, pfp_url: pfpUrl, text: msg, image_url: imageUrl, timestamp: Date.now() }
        ]);

      if (error) throw error;
      console.log("Message sent:", data);
    } catch (err) {
      console.error("Insert failed:", err.message);
    }

    input.value = "";
    imageUpload.value = "";
  });

  // ===== Render Messages =====
  async function renderMessages() {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      chatBox.innerHTML = "";

      data.forEach(msg => {
        if (shouldHideMessage(msg.text)) return;

        const msgDiv = document.createElement("div");
        msgDiv.style.display = "flex";
        msgDiv.style.alignItems = "center";
        msgDiv.style.marginBottom = "8px";

        // Profile picture
        if (msg.pfp_url) {
          const pfpImg = document.createElement("img");
          pfpImg.src = msg.pfp_url;
          pfpImg.width = 40;
          pfpImg.height = 40;
          pfpImg.style.borderRadius = "50%";
          pfpImg.style.marginRight = "8px";
          msgDiv.appendChild(pfpImg);
        }

        // Username + Text
        const textDiv = document.createElement("div");
        textDiv.innerHTML = `<b>${msg.username || "Anon"}:</b> ${msg.text}`;
        msgDiv.appendChild(textDiv);

        // Optional message image
        if (msg.image_url) {
          const img = document.createElement("img");
          img.src = msg.image_url;
          img.width = 150;
          img.style.borderRadius = "10px";
          img.style.marginLeft = "8px";
          msgDiv.appendChild(img);
        }

        chatBox.appendChild(msgDiv);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
      console.error("Fetch messages failed:", err.message);
    }
  }

  // ===== Realtime Subscription =====
  supabase
    .channel("public:messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => renderMessages()
    )
    .subscribe();

  // ===== Initial Render =====
  renderMessages();
});
</script>
