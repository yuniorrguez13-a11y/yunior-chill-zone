window.addEventListener("load", async () => {
  // ===== Supabase Setup =====
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ===== DOM Elements =====
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userLabel = document.getElementById("user-label");

  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const typeSelect = document.getElementById("type");

  const normalContainer = document.getElementById("normal-video-container");
  const doomscrollContainer = document.getElementById("doomscroll-container");

  let currentUser = null;

  // ===== Auth Functions =====
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
    }
  };

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
  };

  // ===== Upload Video =====
  uploadBtn.onclick = async () => {
    if (!currentUser) return alert("Login first!");

    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const type = typeSelect.value;

    if (!file || !title) return alert("Provide a title and select a file.");

    const fileName = crypto.randomUUID() + "." + file.name.split('.').pop();
    const bucket = type === "doomscroller" ? "doomscroller" : "video";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) return console.error(uploadError);

    const { error: dbError } = await supabase.from("videos").insert([
      {
        id: crypto.randomUUID(),
        title,
        file_path: fileName,
        type,
        user_id: currentUser.id
      }
    ]);

    if (dbError) return console.error(dbError);

    alert("Video uploaded!");
    titleInput.value = "";
    fileInput.value = "";
    loadVideos();
  };

  // ===== Load Videos =====
  async function loadVideos() {
    // Load Normal Videos
    const { data: normalVideos, error: normalError } = await supabase
      .from("videos")
      .select("*")
      .eq("type", "normal")
      .order("created_at", { ascending: false });

    if (normalError) return console.error(normalError);

    normalContainer.innerHTML = "";
    normalVideos.forEach(v => {
      const url = supabase.storage.from("video").getPublicUrl(v.file_path).data.publicUrl;
      const videoEl = document.createElement("video");
      videoEl.src = url;
      videoEl.controls = true;
      videoEl.style.width = "600px";

      const titleEl = document.createElement("h3");
      titleEl.textContent = v.title;

      normalContainer.appendChild(titleEl);
      normalContainer.appendChild(videoEl);
    });

    // Load Doomscroll Videos
    const { data: doomVideos, error: doomError } = await supabase
      .from("videos")
      .select("*")
      .eq("type", "doomscroller")
      .order("created_at", { ascending: false });

    if (doomError) return console.error(doomError);

    doomscrollContainer.innerHTML = "";
    doomVideos.forEach(v => {
      const url = supabase.storage.from("doomscroller").getPublicUrl(v.file_path).data.publicUrl;
      const container = document.createElement("div");
      container.className = "doom-video-container";
      container.style.height = "100vh";

      const videoEl = document.createElement("video");
      videoEl.src = url;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.style.height = "100%";

      container.appendChild(videoEl);
      doomscrollContainer.appendChild(container);
    });

    // IntersectionObserver for autoplay/pause
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const vid = entry.target.querySelector("video");
        if (entry.isIntersecting) vid.play();
        else vid.pause();
      });
    }, { threshold: 0.75 });

    document.querySelectorAll(".doom-video-container").forEach(el => observer.observe(el));
  }

  // ===== Initialize =====
  checkAuth();
  loadVideos();
});
