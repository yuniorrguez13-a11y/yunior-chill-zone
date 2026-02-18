window.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const BUCKET = "video";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const authIndicator = document.getElementById("auth-indicator");
  const authStatus = document.getElementById("auth-status");

  const uploadType = document.getElementById("upload-type");
  const uploadFile = document.getElementById("upload-file");
  const uploadBtn = document.getElementById("upload-btn");
  const uploadStatus = document.getElementById("upload-status");

  const feed = document.getElementById("feed");
  const refreshBtn = document.getElementById("refresh-btn");
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const railButtons = Array.from(document.querySelectorAll(".rail-btn"));

  const channelHeader = document.getElementById("channel-header");
  const channelAvatar = document.getElementById("channel-avatar");
  const channelTitle = document.getElementById("channel-title");
  const channelSubtitle = document.getElementById("channel-subtitle");
  const clearChannelBtn = document.getElementById("clear-channel-btn");

  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");

  const CHANNEL_QUERY_KEY = "channel";
  let currentUser = null;
  let activeFeed = "feed";
  let searchTerm = "";
  let channelFilter = new URLSearchParams(window.location.search).get(CHANNEL_QUERY_KEY);

  function setStatus(el, text, isError = false) {
    el.textContent = text;
    el.style.color = isError ? "#ff8484" : "#a9a9a9";
  }

  function sanitizeUsername(value) {
    return (value || "guest").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  }

  function usernameFromUser(user) {
    return sanitizeUsername(user?.email?.split("@")[0]);
  }

  function isVerified(user) {
    return Boolean(user?.email_confirmed_at);
  }

  function setActiveFeedUI(mode) {
    activeFeed = mode;
    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.feed === mode);
    });
    railButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.feed === mode);
    });
  }

  function updateQueryChannel(channelName) {
    const params = new URLSearchParams(window.location.search);
    if (channelName) params.set(CHANNEL_QUERY_KEY, channelName);
    else params.delete(CHANNEL_QUERY_KEY);
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", next);
  }

  function displayChannelHeader() {
    if (!channelFilter) {
      channelHeader.style.display = "none";
      channelAvatar.textContent = "";
      channelTitle.textContent = "";
      channelSubtitle.textContent = "";
      return;
    }

    channelHeader.style.display = "flex";
    channelAvatar.textContent = channelFilter.slice(0, 2).toUpperCase();
    channelTitle.textContent = `@${channelFilter}`;
    channelSubtitle.textContent = "Channel page";
  }

  function fileTitle(name) {
    const decoded = decodeURIComponent(name || "");
    return decoded.replace(/\.[^.]+$/, "") || "untitled";
  }

  async function getPlayableUrl(path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) return data.publicUrl;

    const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    return signedData?.signedUrl || "";
  }

  function normalizeKind(kind) {
    if (kind === "doomscroll" || kind === "shorts") return "doomscroll";
    return "videos";
  }

  async function listCategory(folder, kind) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;

    const output = [];

    for (const item of data || []) {
      if (item.metadata) {
        output.push({
          ...item,
          kind: normalizeKind(kind || folder),
          channel: "main",
          fullPath: `${folder}/${item.name}`
        });
        continue;
      }

      const nestedPath = `${folder}/${item.name}`;
      const { data: nestedData } = await supabase.storage
        .from(BUCKET)
        .list(nestedPath, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      for (const nested of nestedData || []) {
        if (!nested.metadata) continue;
        output.push({
          ...nested,
          kind: normalizeKind(kind || folder),
          channel: sanitizeUsername(item.name),
          fullPath: `${nestedPath}/${nested.name}`
        });
      }
    }

    return output;
  }

  async function listAllVideos() {
    const videos = await listCategory("videos", "videos");

    let doomscroll = [];
    try {
      doomscroll = await listCategory("doomscroll", "doomscroll");
    } catch {
      doomscroll = await listCategory("shorts", "doomscroll").catch(() => []);
    }

    return [...videos, ...doomscroll];
  }

  function filterItems(items, mode) {
    let filtered = [...items];

    if (channelFilter) {
      filtered = filtered.filter((item) => item.channel === channelFilter);
    }

    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => fileTitle(item.name).toLowerCase().includes(needle));
    }

    if (mode === "videos") return filtered.filter((item) => item.kind === "videos");
    if (mode === "doomscroll") return filtered.filter((item) => item.kind === "doomscroll");
    return filtered;
  }

  function openChannel(name) {
    channelFilter = sanitizeUsername(name);
    updateQueryChannel(channelFilter);
    displayChannelHeader();
    loadFeed(activeFeed);
  }

  function createVideoCard(item, mode) {
    const card = document.createElement("article");
    const isDoomscroll = mode === "doomscroll" || item.kind === "doomscroll";
    card.className = `video-card ${isDoomscroll ? "doomscroll" : ""}`;

    const video = document.createElement("video");
    video.src = item.url;
    video.controls = true;
    video.preload = "metadata";

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("h3");
    title.className = "title";
    title.textContent = fileTitle(item.name);

    const channelLink = document.createElement("a");
    channelLink.className = "channel-link";
    channelLink.href = "#";
    channelLink.textContent = `@${item.channel}`;
    channelLink.addEventListener("click", (event) => {
      event.preventDefault();
      openChannel(item.channel);
    });

    meta.appendChild(title);
    meta.appendChild(channelLink);

    card.appendChild(video);
    card.appendChild(meta);
    return card;
  }

  async function loadFeed(mode = activeFeed) {
    setActiveFeedUI(mode);
    feed.className = mode === "doomscroll" ? "doomscroll-grid" : "feed-grid";
    feed.innerHTML = "<p class='empty'>Loading…</p>";

    let items;
    try {
      items = await listAllVideos();
    } catch (error) {
      feed.innerHTML = `<p class='empty'>Could not load content: ${error.message}</p>`;
      return;
    }

    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const filtered = filterItems(items, mode);

    if (!filtered.length) {
      feed.innerHTML = "<p class='empty'>No videos found for this view.</p>";
      return;
    }

    feed.innerHTML = "";

    for (const item of filtered) {
      const url = await getPlayableUrl(item.fullPath);
      if (!url) continue;
      feed.appendChild(createVideoCard({ ...item, url }, mode));
    }

    if (!feed.childElementCount) {
      feed.innerHTML = "<p class='empty'>No playable videos available.</p>";
    }
  }

  function setAuthUI(user) {
    if (!user) {
      authIndicator.textContent = "Not logged in";
      logoutBtn.style.display = "none";
      uploadBtn.disabled = true;
      setStatus(authStatus, "Create an account, verify it, then sign in.");
      setStatus(uploadStatus, "Sign in with a verified account to upload.");
      return;
    }

    const verified = isVerified(user);
    authIndicator.textContent = verified ? `Signed in: ${user.email}` : `Signed in (unverified): ${user.email}`;
    logoutBtn.style.display = "inline-block";
    uploadBtn.disabled = !verified;

    setStatus(
      authStatus,
      verified ? "Account verified. Uploading is enabled." : "Please verify your account to upload videos."
    );

    if (!verified) {
      setStatus(uploadStatus, "Verification required before upload.");
    }
  }

  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus(authStatus, "Email and password are required.", true);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(authStatus, error.message, true);
      return;
    }

    setStatus(authStatus, "Account created. Verify your email and sign in.");
  });

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus(authStatus, "Email and password are required.", true);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(authStatus, error.message, true);
      return;
    }

    currentUser = data.user;
    setAuthUI(currentUser);
    await loadFeed(activeFeed);
  });

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentUser = null;
    setAuthUI(currentUser);
  });

  uploadBtn.addEventListener("click", async () => {
    if (!currentUser || !isVerified(currentUser)) {
      setStatus(uploadStatus, "You must be signed in with a verified account.", true);
      return;
    }

    const file = uploadFile.files?.[0];
    if (!file) {
      setStatus(uploadStatus, "Select a video file.", true);
      return;
    }

    const kind = uploadType.value === "doomscroll" ? "doomscroll" : "videos";
    const channel = usernameFromUser(currentUser);
    const safeFileName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || `${Date.now()}.mp4`;
    const path = `${kind}/${channel}/${safeFileName}`;

    uploadBtn.disabled = true;
    setStatus(uploadStatus, "Uploading video...");

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "video/mp4"
    });

    if (error) {
      setStatus(uploadStatus, `Upload failed: ${error.message}`, true);
      setAuthUI(currentUser);
      return;
    }

    setStatus(uploadStatus, "Upload complete.");
    uploadFile.value = "";
    setAuthUI(currentUser);
    await loadFeed(activeFeed);
  });

  refreshBtn.addEventListener("click", () => loadFeed(activeFeed));

  [...tabButtons, ...railButtons].forEach((button) => {
    button.addEventListener("click", () => {
      loadFeed(button.dataset.feed || "feed");
    });
  });

  clearChannelBtn.addEventListener("click", () => {
    channelFilter = null;
    updateQueryChannel(null);
    displayChannelHeader();
    loadFeed(activeFeed);
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchTerm = searchInput.value.trim();
    loadFeed(activeFeed);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    setAuthUI(currentUser);
  });

  (async () => {
    const { data } = await supabase.auth.getSession();
    currentUser = data.session?.user || null;
    setAuthUI(currentUser);
    displayChannelHeader();
    await loadFeed("feed");
  })();
});
