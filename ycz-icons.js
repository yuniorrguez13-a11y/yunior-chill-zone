/* ═══════════════════════════════════════════════════════════════
   YUNIORS CHILL ZONE — icons
   Stroke-based SVGs, 24×24, drawn with currentColor so they take
   the colour of whatever they sit in. No CDN, no font, no emoji —
   identical on Windows, Mac, Android and iOS.

   USE:  <i data-ic="hash"></i>            in markup
         icon('hash')                       in JS  → svg string
         icon('hash', 18)                   custom size
   ═══════════════════════════════════════════════════════════════ */

window.YCZ_ICONS = {
  hash:      '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
  coin:      '<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5h3a3.5 3.5 0 0 1 0 7h-3z"/><path d="M8 12h1.5"/>',
  flame:     '<path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.8-5.2-3.5-7-.3 1.7-1.2 2.7-2.3 3-.2-3.2-1.6-6-4.2-8.5.3 3-1.2 4.6-2.6 6.2C5 10.8 5 12.9 5 15.5 5 19.2 7.6 22 12 22z"/><path d="M12 22c-1.9 0-3-1.3-3-3 0-1.5 1-2.6 2.2-3.8.9 1 1.8 1.5 1.8 3.1 0 .9.2 1.4 1 1.9-.4 1.1-1.1 1.8-2 1.8z"/>',
  volume:    '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>',
  volumeOff: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  mic:       '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
  micOff:    '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8M3 3l18 18"/>',
  settings:  '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2"/>',
  bell:      '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  image:     '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  smile:     '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9.5" r="1"/><circle cx="15" cy="9.5" r="1"/>',
  reply:     '<path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  trash:     '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  pencil:    '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  x:         '<path d="M18 6L6 18M6 6l12 12"/>',
  search:    '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  users:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  link:      '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12.3 19"/>',
  chat:      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  gamepad:   '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 12h4M9 10v4"/><circle cx="16.5" cy="11" r="1"/><circle cx="18.5" cy="13.5" r="1"/>',
  bot:       '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4"/><circle cx="12" cy="3" r="1"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>',
  ban:       '<circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/>',
  upload:    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5M12 5v12"/>',
  send:      '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  crown:     '<path d="M3 18h18"/><path d="M3 8l4 3.5L12 4l5 7.5L21 8v7H3z"/>',
  shield:    '<path d="M12 2l8 3.5V11c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V5.5z"/>',
  wrench:    '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.8 2.8 0 0 1-4-4z"/><path d="M14.7 6.3l3-3"/>',
  menu:      '<path d="M3 6h18M3 12h18M3 18h18"/>',
  chevron:   '<path d="M6 9l6 6 6-6"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowUp:   '<path d="M12 19V5M5 12l7-7 7 7"/>',
  check:     '<path d="M20 6L9 17l-5-5"/>',
  copy:      '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  play:      '<path d="M6 4l14 8-14 8z"/>',
  pause:     '<path d="M8 4v16M16 4v16"/>',
  video:     '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="M22 8l-6 4 6 4z"/>',
  music:     '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  piano:     '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 5v9M12 5v9M17 5v9M2 14h20"/>',
  grid:      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bolt:      '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  heart:     '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z"/>',
  home:      '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/><path d="M10 21v-6h4v6"/>',
  camera:    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  user:      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pin:       '<path d="M12 17v5"/><path d="M9 3h6v6l3 4.5H6L9 9z"/>',
  sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  megaphone: '<path d="M3 11l14-5v12L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/><path d="M20.5 9a4 4 0 0 1 0 6"/>',
  mail:      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
  lock:      '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock:    '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5"/>',
  timer:     '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>',
  scroll:    '<path d="M8 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8"/><path d="M8 3a2 2 0 0 0-2 2v12"/><path d="M6 17a2 2 0 0 0 0 4h2"/><path d="M11 8h6M11 12h6M11 16h4"/>',
  refresh:   '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v5h-5"/>',
  swords:    '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5L18 3h3v3l-3.5 3.5"/><path d="M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  expand:    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M16 21h3a2 2 0 0 0 2-2v-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
  shrink:    '<path d="M3 8h3a2 2 0 0 0 2-2V3M21 8h-3a2 2 0 0 1-2-2V3M21 16h-3a2 2 0 0 0-2 2v3M3 16h3a2 2 0 0 1 2 2v3"/>',
  trophy:    '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v4M9 21h6"/>',
  keyboard:  '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/>',
  wifi:      '<path d="M2 8.8a16 16 0 0 1 20 0"/><path d="M5 12.3a11 11 0 0 1 14 0"/><path d="M8.5 15.8a6 6 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
  battery:   '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2"/><path d="M5 10h7v4H5z" fill="currentColor" stroke="none"/>',
};

window.icon = function (name, size) {
  const body = window.YCZ_ICONS[name];
  if (!body) return "";
  const s = size || 18;
  return (
    `<svg class="ic-svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true">${body}</svg>`
  );
};

/* swaps every <i data-ic="name"> for its svg */
window.paintIcons = function (root) {
  (root || document).querySelectorAll("[data-ic]").forEach((el) => {
    const svg = window.icon(el.dataset.ic, el.dataset.icSize ? +el.dataset.icSize : undefined);
    if (svg) el.outerHTML = svg;
  });
};

document.addEventListener("DOMContentLoaded", () => window.paintIcons());
