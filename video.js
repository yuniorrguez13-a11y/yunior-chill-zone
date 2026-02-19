// video.js — Supabase auth + Publitio video uploads + feed/history
window.addEventListener("load", async () => {

  // ===== Supabase setup (your actual key)
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ===== Publitio setup
  const PUBLITIO_API_KEY = "QlyLHd9mr0DySfB8HLX5"; // public key
  const PUBLITIO_API_SECRET = "w1Ngdy2eWaw4iM4yeh9iskkSHmzvrvq6"; // for signing (only in frontend with caution)

  // ===== DOM elements
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userLabel = document.getElementById("user-label");

  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const descriptionInput = document.getElementById("description");
  const typeSelect = document.getElementById("type");

  const videoGrid = document.getElementById("video-grid");
  const miniHistory = document.getElementById("mini-history");

  let currentUser = null;
  let feedPage = 0;
  const PAGE_SIZE = 12;
  let sortMode = "new"; // "new" or "pop"

  // ===== Auth helpers
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    updateAuthUI();
  }

  function updateAuthUI() {
    if (!currentUser) {
      loginBtn.style.display = "inline";
      signupBtn.style.display = "inline";
      logoutBtn.style.display = "none";
      userLabel.textContent = "";
      uploadBtn.disabled = true;
    } else {
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      logoutBtn.style.display = "inline";
      userLabel.textContent = "Logged in as: " + currentUser.email;
      uploadBtn.disabled = false;
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
      updateAuthUI();
      loadFeedPage();
      loadMiniHistory();
    }
  };

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
    videoGrid.innerHTML = "";
    miniHistory.innerHTML = "";
  };

  // ===== Upload video (Publitio)
  uploadBtn.onclick = async () => {
    if (!currentUser) return alert("Login first!");

    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const type = typeSelect.value;

    if (!file || !title) return alert("Select a file and provide a title.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("key", PUBLITIO_API_KEY);

    try {
      // upload to Publitio
      const res = await fetch("https://upload.publit.io/1/files", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!data || data.error) {
        console.error("Publitio upload failed", data);
        return alert("Upload failed");
      }

      // save video metadata in Supabase
      const { error: dbError } = await supabase.from("videos").insert([{
        id: crypto.randomUUID(),
        title,
        description,
        file_path: data.file_id,
        type,
        user_id: currentUser.id,
        views: 0,
        created_at: new Date().toISOString()
      }]);

      if (dbError) {
        console.error("DB error", dbError);
        return alert("Could not save video info");
      }

      alert("Video uploaded!");
      titleInput.value = "";
      descriptionInput.value = "";
      fileInput.value = "";
      loadFeedPage();
      loadMiniHistory();

    } catch (err) {
      console.error("Upload error", err);
      alert("Upload failed");
    }
  };

  // ===== Feed / pagination
  async function loadFeedPage() {
    const from = feedPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("videos").select("*");

    if (sortMode === "new") query = query.order("created_at", { ascending: false });
    else query = query.order("views", { ascending: false });

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) return console.error("Feed error", error);
    if (!data || data.length === 0) return;

    data.forEach(v => {
      const card = createVideoCard(v);
      videoGrid.appendChild(card);
    });

    feedPage++;
  }

  function createVideoCard(v) {
    const card = document.createElement("div");
    card.className = "video-card";

    const thumb = document.createElement("video");
    thumb.src = `https://media.publit.io/file/${v.file_path}`; // Publitio playback
    thumb.controls = true;
    thumb.style.width = "300px";
    thumb.style.height = "170px";

    const titleEl = document.createElement("p");
    titleEl.textContent = v.title;

    card.appendChild(thumb);
    card.appendChild(titleEl);

    return card;
  }

  // ===== Watch history (localStorage fallback)
  async function loadMiniHistory() {
    miniHistory.innerHTML = "";
    if (!currentUser) return;
    const { data: hist } = await supabase.from("watch_history").select("video_id").eq("user_id", currentUser.id).order("watched_at", { ascending: false }).limit(8);
    if (!hist) return;

    for (const h of hist) {
      const { data: vids } = await supabase.from("videos").select("*").eq("id", h.video_id).limit(1);
      if (vids && vids[0]) {
        const el = document.createElement("div");
        el.textContent = vids[0].title;
        miniHistory.appendChild(el);
      }
    }
  }

  // ===== Sort toggles
  document.getElementById("sort-new").addEventListener("click", () => {
    sortMode = "new"; feedPage = 0; videoGrid.innerHTML = ""; loadFeedPage();
  });
  document.getElementById("sort-pop").addEventListener("click", () => {
    sortMode = "pop"; feedPage = 0; videoGrid.innerHTML = ""; loadFeedPage();
  });

  // ===== Init
  checkAuth();
  loadFeedPage();
  loadMiniHistory();

});
