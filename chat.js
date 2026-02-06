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

  // ===== Rooms =====
  joinRoomBtn.onclick = () => {
    const val = roomInput.value.trim();
    currentRoom = val || "global";
    currentRoomLabel.textContent = "Current room: " + currentRoom;
    renderMessages();
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
      { 
        room_id: currentRoom,
        user_id: currentUser.id,
        username,
        pfp_url: pfpUrl,
        text: msg 
      }
    ]);

    if (error) console.error(error);
    input.value = "";
  });

  // ===== Render Messages =====
  async function renderMessages() {
    // Get all messages in the current room
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", currentRoom)
      .order("id", { ascending: true });
    if (msgError) return console.error(msgError);

    chatBox.innerHTML = "";

    // Fetch all user tags at once for efficiency
    const userIds = [...new Set(messages.map(msg => msg.user_id))];
    const { data: usersData, error: userError } = await supabase
      .from("users")
      .select("id, username, pfp_url, \"tag-id\"")
      .in("id", userIds);
    if (userError) return console.error(userError);

    const usersMap = {};
    usersData.forEach(u => {
      usersMap[u.id] = u;
    });

    // Render each message
    messages.forEach(msg => {
      if (shouldHideMessage(msg.text)) return;

      const user = usersMap[msg.user_id] || { username: msg.username, pfp_url: "", "tag-id": "" };

      const msgDiv = document.createElement("div");
      msgDiv.style.display = "flex";
      msgDiv.style.marginBottom = "10px";

      if (user.pfp_url) {
        const pfp = document.createElement("img");
        pfp.src = user.pfp_url;
        pfp.width = 40;
        pfp.height = 40;
        pfp.style.borderRadius = "50%";
        pfp.style.marginRight = "10px";
        msgDiv.appendChild(pfp);
      }

      const content = document.createElement("div");

      const name = document.createElement("b");
      // Show tag if it exists
      name.textContent = user.username + (user["tag-id"] ? ` [${user["tag-id"]}]` : "") + ": ";

      const messageText = document.createElement("span");
      messageText.textContent = msg.text;

      content.appendChild(name);
      content.appendChild(messageText);
      msgDiv.appendChild(content);
      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== Realtime (per room) =====
  supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      if (payload.new.room_id === currentRoom) {
        renderMessages();
      }
    })
    .subscribe();

  checkAuth();
  renderMessages();
});
