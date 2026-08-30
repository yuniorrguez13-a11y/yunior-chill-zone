# Promo video brief — context for the local session

You are picking up a task started in a Claude Code cloud session. Read this
whole file before doing anything. The owner (Yunior) speaks Spanish, is not a
professional developer, and wants things explained plainly, one step at a time.

## The goal

Promo/demo videos for **SFFG** (the fighting game at `fight.html`, lives at
yuniorschillzone.xyz/fight.html) and eventually for the site as a whole.
**Everything on screen and in narration is in ENGLISH.** The owner will likely
want to use **OpenMontage** (or another local editing tool he mentions) — ask
him which tool he has before assuming.

## What was already tried (and why it wasn't good enough)

Three versions were produced in the cloud sandbox. The owner rejected all
three as "terrible". Learn from each:

1. **v1 — ffmpeg cut of Playwright screen recordings.** Fatal flaw: the cloud
   box has no GPU, so browser recordings are ~25fps with warped timing —
   choppy gameplay. Editing was static cards + caption overlays. Rejected:
   "snappy, la edición es mala".
2. **v2 — MoviePy edit (zooms, crossfades, synth music, game SFX).** Footage
   fixed by **frame-stepped capture** (see below) so gameplay is smooth 30fps.
   Still rejected before delivery evolved further.
3. **v3 — HyperFrames composition** (HTML+GSAP, AI narration via local Kokoro
   TTS, kinetic keyword bars, FIGHT stamp slam, music + SFX mix). Owner still
   called it terrible. He didn't specify what exactly — **ask him what he
   hated** (pacing? the AI voice? the look of the captions? the music? the
   gameplay choreography?) before building v4, or you'll repeat the cycle.

## What's in this folder (ready to reuse)

- `clips/` — 1920×1080 30fps gameplay clips, **already smooth** (the match and
  training clips were captured frame-by-frame from the deterministic engine,
  so their timing is perfect):
  - `hd-menu.mp4` (~8s) — game menu, keyboard navigation
  - `hd-select.mp4` (~11s) — character select, hovers + picks
  - `hd-match.mp4` (29s) — Regular Guy vs Parasoul, CPU match, dusk stage
  - `hd-training.mp4` (11.7s) — training mode, hitboxes + frame data visible
  - `hd-creator.mp4` (~5s) — create.html scroll (the no-code fighter creator)
- `audio/music.wav` — 51s original dark-synthwave bed, 112 BPM, A minor,
  synthesized in numpy by us. **Fully original, zero copyright issues.**
- `audio/n1.wav … n7.wav` — English narration (Kokoro TTS, male voice
  "am_michael"). Script, in order:
  1. "This is S F F G. A real fighting game that runs right in your browser.
     No install, no account — just fight." (7.7s)
  2. "Pick from the official roster, or grab a fighter made by the community." (4.3s)
  3. "Fight the CPU, share a keyboard with a friend, or go online against anyone." (5.1s)
  4. "Supers, throws, armor, bursts — it's all in here." (2.9s)
  5. "Training mode shows you hitboxes and live frame data, like the real deal." (4.7s)
  6. "And if you want your own fighter? Build one. No code needed." (3.6s)
  7. "Play it free at yuniors chill zone dot x y z." (2.9s)
- `capture-smooth.js` — the frame-stepped capture script (Playwright). It
  virtualizes `requestAnimationFrame` so each tick advances the engine exactly
  1/60s, screenshotting every 2nd tick → perfectly even 30fps no matter how
  slow the machine. Adapt paths/URL if you re-capture. **On this local machine
  you also have a real GPU** — plain 60fps captures (OBS/Game Bar, or
  Playwright with `--use-gl` working) may look even better; prefer them if the
  owner is willing, but he has said he will NOT record anything manually.

## Reusable art already in the repo

- `art/sffg-logo.png` — the graffiti wordmark (white, transparent bg). This is
  the brand; title/outro cards use it.
- `art/stamps/` — hand-drawn stamps (`fight.png`, `ko.png`, `perfect.png`,
  `time.png`, `doubleko.png`) — the game's own art, great as slam overlays.
- `art/sfx/` — real hit sounds (`hit1/hit2/block/whoosh/armor/ko.wav`),
  licensed free-for-commercial (Chequered Ink 400 Sounds Pack).
- `fonts/colorfiction-sketch.otf` — hand-drawn font (SIL OFL), used on tier
  badges. DM Sans + Syne are the site's main fonts (Google Fonts).
- **Do NOT use** `art/menu-break/lineup/whistle.png` — they belong to
  suds.html, not SFFG.

## Brand rules for the video

- Palette: chrome stays neutral ink (`#0d0c11` family); red `#e10600` is the
  accent (P1/interaction); P2 identity is cyan. Color belongs to the
  characters and the stage — don't drown the frame in red.
- The dusk stage (violet→ember) is the game's signature look.
- Music: the synth bed above is ours. If the owner prefers a trending sound,
  deliver the video without music and he adds it in the platform app.
  **Original or CC0 audio/art only — non-negotiable.**
- Owner's positioning line (he coined it): "the new mugen" — community
  fighters with zero balance limits, no-code creator. That's the hook that
  got traction on X.

## Working with the owner

- He tests on his phone and his Lenovo (Windows). Speak Spanish to him,
  keep explanations short, no big technical dumps.
- He has increased mouse sensitivity — never make him hand-copy small values
  or select tiny text; give him complete paste-ready blocks or do it yourself.
- Before building anything long: show him a plan of scenes/beats in a few
  lines and get his OK. After three rejected videos, alignment first, then
  render. Ask what he wants to see changed vs v3 (voice? pacing? style?).
- Deliverables land faster if you show him a 5–10s test render of the style
  BEFORE producing the full video.

## Cloud-session leftovers (not on this machine)

The cloud session also produced: a MoviePy kit (`make_video.py`), a
HyperFrames project (`hf-sffg/` with the v3 composition), and the rendered
v1–v3 MP4s. They live in the cloud sandbox only. If you need any of it, ask
the cloud session / the owner — but honestly, starting fresh with a proper
local tool and these assets is the better path.
