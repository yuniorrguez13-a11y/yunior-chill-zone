window.addEventListener("load", () => {
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("msg-input");
  const sendBtn = document.getElementById("send-btn");
  const usernameInput = document.getElementById("username-input");
  const safeModeToggle = document.getElementById("safe-mode-toggle");

  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  let currentUser = null;

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

  sendBtn.addEventListener("click", async () => {
    if (!currentUser) return;
    const msg = input.value.trim();
    if (!msg) return;

    const username = usernameInput.value.trim() || "User";

    const { error } = await supabase.from("messages").insert([
      { user_id: currentUser.id, username, text: msg }
    ]);

    if (error) console.error(error);
    input.value = "";
  });

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

      const content = document.createElement("div");
      const text = document.createElement("div");
      text.innerHTML = `<b>${msg.username}:</b> ${msg.text}`;
      content.appendChild(text);
      msgDiv.appendChild(content);
      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, renderMessages)
    .subscribe();

  checkAuth();
  renderMessages();
});
