// video.js — big feature set: feed, infinite scroll, history, channels, modal player
window.addEventListener("load", async () => {

  // ================= Supabase init (your project)
  const SUPABASE_URL = "https://heohcnhgclcnmssjklom.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yin3csqaWiHWi5kUbfdeiA_0LE6OSiq";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ================= DOM refs
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

  const videoGrid = document.getElementById("video-grid");
  const doomscrollContainer = document.getElementById("doomscroll-container");
  const channelsList = document.getElementById("channels-list");
  const miniHistory = document.getElementById("mini-history");
  const feedTitle = document.getElementById("feed-title");
  const feedSubtitle = document.getElementById("feed-subtitle");
  const feedCard = document.getElementById("feed-card");

  const loadingSentinel = document.getElementById("loading-sentinel");

  // modal elements
  const modal = document.getElementById("video-modal");
  const modalBackdrop = document.getElementById("video-modal-backdrop");
  const closeModalBtn = document.getElementById("close-modal");
  const player = document.getElementById("player");
  const playerTitle = document.getElementById("player-title");
  const playerUploader = document.getElementById("player-uploader");
  const playerViews = document.getElementById("player-views");
  const subscribeBtn = document.getElementById("subscribe-btn");

  // nav elements
  const navItems = document.querySelectorAll(".nav-item");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const sortNew = document.getElementById("sort-new");
  const sortPop = document.getElementById("sort-pop");
  const clearHistoryBtn = document.getElementById("clear-history");
  const viewAllChannelsBtn = document.getElementById("view-all-channels");

  // state
  let currentUser = null;
  let currentView = "home"; // home, feed, history, channels, upload
  let feedPage = 0;
  const PAGE_SIZE = 12;
  let feedFilter = null; // e.g. { user_id: "..." } for channel view
  let sortMode = "new"; // new or pop

  // ================ Auth helpers
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
    else alert("Check your email for confirmation.");
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

  // ================ Upload logic
  fileInput.addEventListener("change", () => {
    uploadBtn.disabled = !fileInput.files.length;
  });

  uploadBtn.onclick = async () => {
    if (!currentUser) return alert("Login first to upload.");
    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const type = typeSelect.value;

    if (!file || !title) return alert("Provide a title and choose a file.");

    const ext = file.name.split(".").pop();
    const filename = crypto.randomUUID() + "." + ext;
    const bucket = type === "doomscroller" ? "doomscroller" : "video";

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, file);
    if (uploadError) {
      console.error("Upload error", uploadError);
      return alert("Upload failed.");
    }

    const { error: insertError } = await supabase.from("videos").insert([
      { id: crypto.randomUUID(), title, file_path: filename, type, user_id: currentUser.id }
    ]);
    if (insertError) {
      console.error("DB insert error", insertError);
      return alert("Could not save metadata.");
    }

    titleInput.value = "";
    fileInput.value = "";
    alert("Upload complete.");
    // refresh feed and doom preview
    resetFeedAndLoad();
    loadDoomPreview();
    loadChannels();
  };

  // ================ Feed / Pagination
  function resetFeedAndLoad() {
    feedPage = 0;
    videoGrid.innerHTML = "";
    loadFeedPage();
  }

  async function loadFeedPage() {
    loadingSentinel.style.display = "block";
    const from = feedPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("videos").select("*");

    if (feedFilter && feedFilter.user_id) {
      query = query.eq("user_id", feedFilter.user_id);
      feedTitle.textContent = "Channel";
      feedSubtitle.textContent = "Videos from this channel";
    } else {
      feedTitle.textContent = currentView === "history" ? "History" : "Home";
      feedSubtitle.textContent = (sortMode === "new") ? "Newest videos" : "Most viewed";
    }

    if (sortMode === "new") query = query.order("created_at", { ascending: false });
    else query = query.order("views", { ascending: false });

    query = query.range(from, to);

    const { data, error } = await query;
    loadingSentinel.style.display = "none";
    if (error) {
      console.error("Feed load error", error);
      return;
    }

    if (!data || data.length === 0) {
      // nothing more
      loadingSentinel.textContent = "No more videos";
      return;
    }

    data.forEach(video => {
      const card = createVideoCard(video);
      videoGrid.appendChild(card);
    });

    feedPage++;
  }

  // infinite scroll sentinel observer
  const sentinelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && currentView === "home" && feedFilter == null) {
        loadFeedPage();
      } else if (entry.isIntersecting && currentView === "feed" && feedFilter == null) {
        loadFeedPage();
      } else if (entry.isIntersecting && currentView === "channels" && feedFilter == null) {
        // load channels listing; handled separately
      } else if (entry.isIntersecting && currentView === "channel" && feedFilter != null) {
        loadFeedPage();
      } else if (entry.isIntersecting && currentView === "history") {
        // history loaded differently
      }
    });
  }, { root: null, threshold: 0.6 });

  sentinelObserver.observe(loadingSentinel);

  // ================ Video card builder
  function createVideoCard(v) {
    const card = document.createElement("div");
    card.className = "video-card";

    const thumb = document.createElement("div");
    thumb.className = "thumb-wrap";

    // Use public url — bucket is 'video' for normal
    const bucketName = v.type === "doomscroller" ? "doomscroller" : "video";
    const publicUrl = supabase.storage.from(bucketName).getPublicUrl(v.file_path).data.publicUrl;

    // use a muted autoplaying small video as thumbnail fallback (preload metadata)
    const thumbVideo = document.createElement("video");
    thumbVideo.muted = true;
    thumbVideo.playsInline = true;
    thumbVideo.preload = "metadata";
    thumbVideo.src = publicUrl;
    thumbVideo.setAttribute("aria-hidden", "true");
    thumbVideo.style.height = "150px";
    thumbVideo.style.width = "100%";
    thumbVideo.style.objectFit = "cover";
    // do not autoplay on grid by default; only play on hover
    thumbVideo.addEventListener("mouseenter", () => thumbVideo.play());
    thumbVideo.addEventListener("mouseleave", () => { thumbVideo.pause(); thumbVideo.currentTime = 0; });

    thumb.appendChild(thumbVideo);

    const meta = document.createElement("div");
    meta.className = "video-meta";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const info = document.createElement("div");
    const title = document.createElement("p");
    title.className = "video-title";
    title.textContent = v.title;

    const sub = document.createElement("div");
    sub.className = "video-sub";
    sub.textContent = `By ${shortid(v.user_id)} • ${v.views || 0} views`;

    info.appendChild(title);
    info.appendChild(sub);

    meta.appendChild(avatar);
    meta.appendChild(info);

    card.appendChild(thumb);
    card.appendChild(meta);

    // click plays in modal
    card.addEventListener("click", () => openPlayerModal(v.id));

    return card;
  }

  // helper to shorten user id for display if we don't have username
  function shortid(id) {
    if (!id) return "Unknown";
    return id.slice(0, 6);
  }

  // ================ Player modal + history + views increment
  async function openPlayerModal(videoId) {
    // fetch video full record
    const { data: videos, error } = await supabase.from("videos").select("*").eq("id", videoId).limit(1);
    if (error || !videos || videos.length === 0) {
      console.error("Cannot open video", error);
      return;
    }
    const v = videos[0];
    const bucketName = v.type === "doomscroller" ? "doomscroller" : "video";
    const url = supabase.storage.from(bucketName).getPublicUrl(v.file_path).data.publicUrl;

    // set player src
    player.src = url;
    playerTitle.textContent = v.title || "Untitled";
    playerUploader.textContent = "By " + shortid(v.user_id || "");
    playerViews.textContent = `${v.views || 0} views`;

    // show modal
    modal.setAttribute("aria-hidden", "false");
    player.play().catch(()=>{});

    // increment views optimistically
    try {
      const newViews = (v.views || 0) + 1;
      await supabase.from("videos").update({ views: newViews }).eq("id", v.id);
      playerViews.textContent = `${newViews} views`;
    } catch (e) {
      console.warn("Could not increment views", e);
    }

    // save watch history
    saveWatchHistory(v.id, v.title, v.file_path, v.type);

    // subscribe button UI (non-functional placeholder)
    subscribeBtn.onclick = () => {
      alert("Subscribe feature not implemented (you can wire a subscriptions table).");
    };
  }

  closeModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    player.pause();
    player.src = "";
  }

  // ================ Watch history (Supabase if logged in, otherwise localStorage)
  async function saveWatchHistory(videoId, title, file_path, type) {
    const entry = { id: crypto.randomUUID(), video_id: videoId, watched_at: new Date().toISOString() };

    if (currentUser && currentUser.id) {
      // write to Supabase table if available
      const { error } = await supabase.from("watch_history").insert([
        { user_id: currentUser.id, video_id: videoId }
      ]);
      if (error) {
        // fallback to local
        addLocalHistory({ video_id: videoId, title, file_path, type, watched_at: entry.watched_at });
        return;
      }
      // update mini history display
      loadMiniHistory();
    } else {
      // local fallback
      addLocalHistory({ video_id: videoId, title, file_path, type, watched_at: entry.watched_at });
    }
  }

  function addLocalHistory(item) {
    const key = "yc_local_history_v1";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    // put newest at front and limit 50
    list.unshift(item);
    while (list.length > 50) list.pop();
    localStorage.setItem(key, JSON.stringify(list));
    loadMiniHistory();
  }

  async function loadMiniHistory() {
    miniHistory.innerHTML = "";
    if (currentUser && currentUser.id) {
      // try load from DB
      const { data: hist, error } = await supabase.from("watch_history").select("video_id,watched_at").eq("user_id", currentUser.id).order("watched_at", { ascending: false }).limit(8);
      if (error || !hist) {
        // fallback to local
        renderLocalMiniHistory();
        return;
      }
      const ids = hist.map(h => h.video_id);
      if (ids.length === 0) { miniHistory.textContent = "No recent videos"; return; }
      const { data: vids } = await supabase.from("videos").select("*").in("id", ids).limit(8);
      if (!vids) return;
      vids.forEach(v => {
        const item = document.createElement("div");
        item.className = "mini-item";
        item.textContent = v.title || "(untitled)";
        item.addEventListener("click", () => openPlayerModal(v.id));
        miniHistory.appendChild(item);
      });
    } else {
      renderLocalMiniHistory();
    }
  }

  function renderLocalMiniHistory() {
    miniHistory.innerHTML = "";
    const key = "yc_local_history_v1";
    const list = JSON.parse(localStorage.getItem(key) || "[]").slice(0, 8);
    if (list.length === 0) { miniHistory.textContent = "No recent videos"; return; }
    list.forEach(l => {
      const item = document.createElement("div");
      item.className = "mini-item";
      item.textContent = l.title || "(untitled)";
      item.addEventListener("click", () => openPlayerModal(l.video_id));
      miniHistory.appendChild(item);
    });
  }

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("yc_local_history_v1");
    // note: does not clear DB watch_history
    loadMiniHistory();
  });

  // ================ Channels
  async function loadChannels(limit = 10) {
    channelsList.innerHTML = "";
    // get distinct user_ids from videos table
    const { data, error } = await supabase.from("videos").select("user_id").limit(100);
    if (error || !data) return;
    const unique = [...new Set(data.map(d => d.user_id).filter(Boolean))].slice(0, limit);
    unique.forEach(uid => {
      const item = document.createElement("div");
      item.className = "channel-item";
      const avatar = document.createElement("div"); avatar.className = "channel-avatar";
      const name = document.createElement("div"); name.textContent = shortid(uid);
      item.appendChild(avatar);
      item.appendChild(name);
      item.addEventListener("click", () => openChannel(uid));
      channelsList.appendChild(item);
    });
  }

  async function openChannel(user_id) {
    // set filter and reset feed
    feedFilter = { user_id };
    currentView = "channel";
    feedPage = 0;
    videoGrid.innerHTML = "";
    loadFeedPage();
  }

  viewAllChannelsBtn.addEventListener("click", async () => {
    currentView = "channels";
    feedFilter = null;
    // load channel list bigger (reuse loadChannels)
    loadChannels(50);
  });

  // ================ Doomscroll preview
  async function loadDoomPreview() {
    doomscrollContainer.innerHTML = "";
    const { data: doom, error } = await supabase.from("videos").select("*").eq("type", "doomscroller").order("created_at", { ascending: false }).limit(6);
    if (!doom || error) return;
    doom.forEach(v => {
      const bucket = "doomscroller";
      const url = supabase.storage.from(bucket).getPublicUrl(v.file_path).data.publicUrl;
      const node = document.createElement("div");
      node.className = "doom-video-container";
      const vid = document.createElement("video");
      vid.src = url;
      vid.muted = true;
      vid.playsInline = true;
      vid.loop = true;
      vid.preload = "metadata";
      vid.addEventListener("mouseenter", () => vid.play());
      vid.addEventListener("mouseleave", () => { vid.pause(); vid.currentTime = 0; });
      node.appendChild(vid);
      node.addEventListener("click", () => openPlayerModal(v.id));
      doomscrollContainer.appendChild(node);
    });
  }

  // ================ Channels listing + feed initializers
  // switch view handlers
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const view = item.getAttribute("data-view");
      currentView = view;
      feedPage = 0;
      feedFilter = null;
      videoGrid.innerHTML = "";

      if (view === "home") { feedTitle.textContent = "Home"; loadFeedPage(); }
      else if (view === "feed") { feedTitle.textContent = "Feed"; loadFeedPage(); }
      else if (view === "history") { feedTitle.textContent = "History"; renderHistoryView(); }
      else if (view === "channels") { loadChannels(50); feedTitle.textContent = "Channels"; }
      else if (view === "upload") { /* scroll to upload card */ document.getElementById("upload-section").scrollIntoView({behavior:"smooth"}); }
    });
  });

  // ================ History view
  async function renderHistoryView() {
    videoGrid.innerHTML = "";
    // if logged in load DB watch_history
    if (currentUser && currentUser.id) {
      const { data: hist } = await supabase.from("watch_history").select("video_id, watched_at").eq("user_id", currentUser.id).order("watched_at", { ascending: false }).limit(50);
      if (!hist || hist.length === 0) { videoGrid.textContent = "No watch history"; return; }
      const ids = hist.map(h => h.video_id);
      const { data: vids } = await supabase.from("videos").select("*").in("id", ids).order("created_at", { ascending: false });
      if (vids) vids.forEach(v => videoGrid.appendChild(createVideoCard(v)));
    } else {
      // local storage fallback
      const list = JSON.parse(localStorage.getItem("yc_local_history_v1") || "[]");
      if (list.length === 0) { videoGrid.textContent = "No watch history"; return; }
      list.slice(0, 50).forEach(l => {
        // try to render quickly, we might not have full video record locally
        const dummy = { id: l.video_id, title: l.title || "(untitled)", file_path: l.file_path, type: l.type };
        videoGrid.appendChild(createVideoCard(dummy));
      });
    }
  }

  // ================ Search
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = (searchInput.value || "").trim();
    if (!q) {
      resetFeedAndLoad();
      return;
    }
    // simple title ilike search
    const { data, error } = await supabase.from("videos").select("*").ilike("title", `%${q}%`).order("created_at", { ascending: false }).limit(100);
    if (error) { console.error(error); return; }
    videoGrid.innerHTML = "";
    data.forEach(v => videoGrid.appendChild(createVideoCard(v)));
  });

  // sort toggles
  sortNew.addEventListener("click", () => { sortMode = "new"; sortNew.classList.add("active"); sortPop.classList.remove("active"); resetFeedAndLoad(); });
  sortPop.addEventListener("click", () => { sortMode = "pop"; sortPop.classList.add("active"); sortNew.classList.remove("active"); resetFeedAndLoad(); });

  // ================ Helpers & init
  function shortid(id) { if (!id) return "Unknown"; return id.slice(0,6); }

  // initial loads
  checkAuth();
  resetFeedAndLoad();
  loadDoomPreview();
  loadChannels();
  loadMiniHistory();

});
