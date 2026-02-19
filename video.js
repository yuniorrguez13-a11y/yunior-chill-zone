// Grab elements
const iframe = document.getElementById('videoFrame');
const reloadBtn = document.getElementById('reloadBtn');

// Reload the iframe when button clicked
reloadBtn.addEventListener('click', () => {
  iframe.src = iframe.src;
});

// Optional: alert if iframe fails
iframe.addEventListener('error', () => {
  alert("Oops! YuniorVideoZone couldn't load. Check your internet or try again later.");
});
