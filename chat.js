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

  const roomInput = document.getElementById("room-input");
  const joinRoomBtn = document.getElementById("join-room-btn");
  const currentRoomLabel = document.getElementById("current-room-label");

  let currentUser = null;
  let currentRoom = "global";

  // Helper function to validate URLs (Fix for Point 1)
  function isValidImageUrl(urlString) {
    try {
      const url = new URL(urlString);
      // Only allow http and https protocols to prevent javascript: or data: exploits
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  // ===== Auth =====
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    usernameInput.value = user?.email?.split("@")[0] || "";
    updateUI();
  }

  function updateUI() {
    if (currentUser) {
      input.disabled = false;
      input.placeholder = "Type a message...";
      sendBtn.disabled = false;
      signupBtn.style.display = "none";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      input.disabled = true;
      input.placeholder = "Login to chat";
      sendBtn.disabled = true;
      signupBtn.style.display = "inline-block";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  }

  // ===== Logic =====
  async function sendMessage() {
    const text = input.value.trim();
    const username = usernameInput.value.trim() || "Anonymous";
    const pfp_url = pfpInput.value.trim();

    if (!text) return;

    const { error } = await supabase.from("messages").insert([
      { 
        text, 
        username, 
        pfp_url, 
        room_id: currentRoom,
        user_id: currentUser?.id 
      }
    ]);

    if (error) alert(error.message);
    else input.value = "";
  }

  function shouldHideMessage(text) {
    if (!safeModeToggle.checked) return false;
    const banned = ["badword1", "badword2"]; // Add your list
    return banned.some(word => text.toLowerCase().includes(word));
  }

  async function renderMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", currentRoom)
      .order("id", { ascending: true });
    if (error) return;

    chatBox.innerHTML = "";

    data.forEach(msg => {
      if (shouldHideMessage(msg.text)) return;

      const msgDiv = document.createElement("div");
      msgDiv.style.display = "flex";
      msgDiv.style.marginBottom = "10px";

      // SECURE PFP RENDERING
      if (msg.pfp_url && isValidImageUrl(msg.pfp_url)) {
        const pfp = document.createElement("img");
        pfp.src = msg.pfp_url;
        pfp.width = 40;
        pfp.height = 40;
        pfp.style.borderRadius = "50%";
        pfp.style.marginRight = "10px";
        pfp.onerror = () => pfp.style.display = 'none'; // Hide if image fails to load
        msgDiv.appendChild(pfp);
      }

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

  // ===== Listeners =====
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check email for confirmation!");
  });

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else checkAuth();
  });

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentUser = null;
    updateUI();
  });

  joinRoomBtn.addEventListener("click", () => {
    currentRoom = roomInput.value.trim() || "global";
    currentRoomLabel.textContent = `Current room: ${currentRoom}`;
    renderMessages();
  });

  // Realtime
  supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      if (payload.new.room_id === currentRoom) renderMessages();
    })
    .subscribe();

  checkAuth();
  renderMessages();
});
