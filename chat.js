window.addEventListener("load", () => {
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

  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // ===== Auth State =====
  let currentUser = null;

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    updateUI();
  }

  function updateUI() {
    if (!currentUser) {
      sendBtn.disabled = true;
      input.disabled = true;
      input.placeholder = "Login to chat";
      signupBtn.style.display = "inline";
      loginBtn.style.display = "inline";
      logoutBtn.style.display = "none";
    } else {
      sendBtn.disabled = false;
      input.disabled = false;
      input.placeholder = "Type your message...";
      signupBtn.style.display = "none";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline";
    }
  }

  // ===== Signup =====
  signupBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) alert(error.message);
    else alert("Check your email to confirm your account!");
  };

  // ===== Login =====
  loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) alert(error.message);
    else {
      currentUser = data.user;
      updateUI();
    }
  };

  // ===== Logout =====
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    currentUser = null;
    updateUI();
  };

  // ===== Safe Mode Filter =====
  let safeModeEnabled = localStorage.getItem("yc_safe_mode") === "true";
  safeModeToggle.checked = safeModeEnabled;

  const blockedWords = ["fuck","shit","bitch","asshole","bastard","dick","pussy","cunt","slut","whore"];
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
    if (!currentUser) return;

    const msg = input.value.trim();
    const file = imageUpload.files[0];
    if (!msg && !file) return;

    const username = usernameInput.value.trim() || "User";
    const pfpUrl = pfpInput.value.trim() || "";

    let imageUrl = "";
    if (file) {
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(`public/${Date.now()}_${file.name}`, file);

      if (!error) {
        const { data: pub } = supabase.storage
          .from("chat-images")
          .getPublicUrl(data.path);
        imageUrl = pub.publicUrl;
      }
    }

    const { error } = await supabase.from("messages").insert([
      {
        user_id: currentUser.id,
        username,
        pfp_url: pfpUrl,
        text: msg,
        image_url: imageUrl
      }
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

    if (error) return;

    chatBox.innerHTML = "";

    data.forEach(msg => {
      if (shouldHideMessage(msg.text)) return;

      const msgDiv = document.createElement("div");
      msgDiv.style.display = "flex";
      msgDiv.style.marginBottom = "10px";

      if (msg.pfp_url) {
        const pfp = document.createElement("img");
        pfp.src = msg.pfp_url;
        pfp.width = 40;
        pfp.height = 40;
        pfp.style.borderRadius = "50%";
        pfp.style.marginRight = "10px";
        msgDiv.appendChild(pfp);
      }

      const content = document.createElement("div");

      if (msg.image_url) {
        const img = document.createElement("img");
        img.src = msg.image_url;
        img.width = 150;
        img.style.display = "block";
        content.appendChild(img);
      }

      const text = document.createElement("div");
      text.innerHTML = `<b>${msg.username}:</b> ${msg.text}`;
      content.appendChild(text);

      msgDiv.appendChild(content);
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

  // ===== Init =====
  checkAuth();
  renderMessages();
});
