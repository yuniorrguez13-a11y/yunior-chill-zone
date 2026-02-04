window.addEventListener("load", () => {
  // ===== Supabase Config =====
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  console.log("Supabase loaded:", supabase);

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
    "fuck","shit","bitch","asshole","bastard","dick","pussy","cunt","slut","whore"
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

      if (error) {
        console.error(error);
      } else {
        const { data: pub } = supabase.storage
          .from("chat-images")
          .getPublicUrl(data.path);
        imageUrl = pub.publicUrl;
      }
    }

    const { error } = await supabase.from("messages").insert([
      { username, pfp_url: pfpUrl, text: msg, image_url: imageUrl }
    ]);

    if (error) console.error(error);

    input.value = "";
    imageUpload.value = "";
  });

  // ===== Render Messages =====
  async function renderMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    chatBox.innerHTML = "";

    data.forEach(msg => {
      if (shouldHideMessage(msg.text)) return;

      const msgDiv = document.createElement("div");

      if (msg.image_url) {
        const img = document.createElement("img");
        img.src = msg.image_url;
        img.width = 150;
        msgDiv.appendChild(img);
      }

      const text = document.createElement("div");
      text.innerHTML = `<b>${msg.username || "Anon"}:</b> ${msg.text}`;
      msgDiv.appendChild(text);

      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== Realtime =====
  supabase
    .channel("messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => renderMessages()
    )
    .subscribe();

  // ===== Initial =====
  renderMessages();
});
