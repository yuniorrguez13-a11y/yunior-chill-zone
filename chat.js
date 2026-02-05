window.addEventListener("load", () => {
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("msg-input");
  const sendBtn = document.getElementById("send-btn");
  const usernameInput = document.getElementById("username-input");
  const pfpInput = document.getElementById("pfp-input");
  const safeModeToggle = document.getElementById("safe-mode-toggle");

  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  let currentUser = null;

  // ===== Auth =====
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    usernameInput.value = user?.email?.split("@")[0] || "";
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

  signupBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email to confirm your account!");
  };

  loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      currentUser = data.user;
      usernameInput.value = currentUser.email.split("@")[0];
      updateUI();
    }
  };

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    currentUser = null;
    updateUI();
  };

  // ===== Safe mode =====
  let safeModeEnabled = localStorage.getItem("yc_safe_mode") === "true";
  safeModeToggle.checked = safeModeEnabled;

  const blockedWords = ["fuck","shit","bitch","asshole","bastard","dick","pussy","cunt","slut","whore"];
  const shouldHideMessage = (text = "") => {
    if (!safeModeEnabled) return false;
    return blockedWords.some(word => text.toLowerCase().includes(word));
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
    if (!msg) return;

    const username = usernameInput.value.trim() || "User";
    const pfpUrl = pfpInput.value.trim() || "";

    const { error } = await supabase.from("messages").insert([
      { user_id: currentUser.id, username, pfp_url: pfpUrl, text: msg }
    ]);

    if (error) console.error(error);
    input.value = "";
  });

  // ===== Render Messages (XSS SAFE) =====
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

      // PFP
      if (msg.pfp_url) {
        const pfp = document.createElement("img");
        pfp.src = msg.pfp_url;
        pfp.width = 40;
        pfp.height = 40;
        pfp.style.borderRadius = "50%";
        pfp.style.marginRight = "10px";
        msgDiv.appendChild(pfp);
      }

      // Text (no innerHTML anywhere)
      const content = document.createElement("div");

      const name = document.createElement("b");
      name.textContent = msg.username + ": ";

      const messageText = document.createElement("span");
      messageText.textContent = msg.text;

      content.appendChild(name);
      content.appendChild(messageText);
      msgDiv.appendChild(content);
      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== Realtime =====
  supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, renderMessages)
    .subscribe();

  checkAuth();
  renderMessages();
});
