/* ow-striker-data.js — Pitty Striker, the data. No DOM, no THREE, no side effects: tables and three pure helpers.
   The arena ("sandstone"), its waypoint graph, the five weapons and their viewmodel primitives, the skins and the case,
   the bots, the difficulty knobs, every line of copy, the sound table, the save shape and its signature.

   Conventions shared with ow-striker.js:
   - metres, x east, z north, y up. MAP rows: x/z = centre, y0 = bottom; every row without `deco` is a collider.
   - The courtyard floor is the ground plane (y 0). Everything else stands on 1.0-high terrace slabs (LANE_Y), which is
     how the courtyard is sunken without a hole in the ground plane. Lane-level nodes/spawns have y = LANE_Y.
   - DECO and model primitives: y is the primitive's centre. `rot` = [rx, ry, rz], applied to the geometry in that order
     (geometry.rotateX → rotateY → rotateZ, exactly like overwork.html's merged()). Cylinders stand along y unless rotated;
     `r` is the top radius, `r2` the bottom radius (defaults to r); `n` is the radial segment count (8 = octagon).
   - Gun space: +z forward (muzzle), +y up, origin at the grip. `skin:true` parts take the skin canvas. */

export const LANE_Y = 1.0;
const L = LANE_Y;

/* ── materials (hex strings; nothing red — #e10600 is UI only) ─────────────────────────────────
   "sandstone" is a night city block, not a desert town. The key names are the ones the MAP rows were
   written against and they stay, so the blockout is untouched; what changed is what each one paints.
   Read them as: sand = asphalt, sandstone = concrete wall, sandstoneDark = pavement / precast, stone =
   kerb and stair concrete, wood = steel crate, awning = shop shutter, palm* = street tree, barrel =
   dumpster, pot = concrete planter. The ground stays a good deal darker than the walls: with both the
   same value the arena read as one flat mass and you could not see where a wall ended and the floor began. */
export const MATS = {
  sand: '#31353d', sandstone: '#6a7079', sandstoneDark: '#525862', stone: '#434952',
  wood: '#4e5a66', woodDark: '#39434d', awning: '#8f3a30', awning2: '#b6bec7',
  palmTrunk: '#3f3a32', palmLeaf: '#38553c', water: '#283a46', barrel: '#375a45', ammo: '#4a5a34',
  pot: '#565c65', metal: '#8b929c', skyLo: '#4a3f42', skyHi: '#0d1120',
  brick: '#6d4c43', brickDark: '#503a33', rust: '#7d5140', glass: '#243040', glow: '#ffb04a', glowWin: '#8a6a34',
  paint: '#c6c2b4', neon: '#4ad2ff', tarp: '#3a4652',
};

/* ── the map ──────────────────────────────────────────────────────────────────────────────────────────────
   40 × 28 walled compound, x ∈ [−20, 20], z ∈ [−14, 14]. Perimeter walls 5 high from the ground = 4 above the terraces.
   Rules kept: every passage ≥ 1.5 wide, step rises 0.2, hop ledges 0.6, unjumpable cover 2.4 (walls) / 1.2 (courtyard parapets
   seen from the terrace, 2.2 seen from the pit). Player capsule r 0.4, jump apex 0.75, step-up 0.45. */
const MAP_ROWS = [];
const R = (id, x, y0, z, w, h, d, mat, o) => { MAP_ROWS.push(Object.assign({ id, x, y0, z, w, h, d, mat }, o || {})); };

// perimeter
R('wallN', 0, 0, 14.25, 41, 5, 0.5, 'sandstone');
R('wallS', 0, 0, -14.25, 41, 5, 0.5, 'sandstone');
R('wallW', -20.25, 0, 0, 0.5, 5, 28, 'sandstone');
R('wallE', 20.25, 0, 0, 0.5, 5, 28, 'sandstone');
// terraces: the lanes (z 5..14 / −14..−5) and the wings (x 5..20 / −20..−5, notched for the descent stairs)
R('terN', 0, 0, 9.5, 40, L, 9, 'sandstoneDark');
R('terS', 0, 0, -9.5, 40, L, 9, 'sandstoneDark');
for (const s of [-1, 1]) {
  const p = s < 0 ? 'W' : 'E';
  R('ter' + p + 'n', s * 12.5, 0, 3.25, 15, L, 3.5, 'sandstoneDark');                       // z 1.5..5
  R('ter' + p + 's', s * 12.5, 0, -3.25, 15, L, 3.5, 'sandstoneDark');                      // z −5..−1.5
  R('ter' + p + 'b', s * 13.5, 0, 0, 13, L, 3, 'sandstoneDark');                            // x 7..20 behind the stair notch
  for (let i = 0; i < 4; i++) R('stair' + p + i, s * (6.75 - 0.5 * i), 0, 0, 0.5, 0.8 - 0.2 * i, 3, 'stone', { step: true });   // five 0.2 rises, 3 wide
  // courtyard parapets: 1.2 above the terrace, 2.2 above the pit — the pit is entered by the stairs and the two arches only
  R('parW' + p + 'n', s * 5.25, L, 3.25, 0.5, 1.2, 3.5, 'sandstone');
  R('parW' + p + 's', s * 5.25, L, -3.25, 0.5, 1.2, 3.5, 'sandstone');
  R('parN' + p, s * 3.75, L, 5.25, 3.5, 1.2, 0.5, 'sandstone');
  R('parS' + p, s * 3.75, L, -5.25, 3.5, 1.2, 0.5, 'sandstone');
}
// the two arches (north / south) over a 3-wide opening onto the pit, each with a 0.6 hop crate below: jump on it, step up out
for (const t of [1, -1]) {
  const p = t > 0 ? 'N' : 'S';
  R('arch' + p + 'a', -1.75, L, t * 5.25, 0.5, 3.0, 0.5, 'stone');
  R('arch' + p + 'b', 1.75, L, t * 5.25, 0.5, 3.0, 0.5, 'stone');
  R('arch' + p + 'lintel', 0, L + 3.0, t * 5.25, 4.0, 0.5, 0.5, 'stone');
  R('hop' + p, 0, 0, t * 4.5, 1.2, 0.6, 1.0, 'wood');
}
// mid: the fountain basin (crouch cover; the octagon lip, water disc and pillar are deco) and two rubble heaps under the palms
R('basin', 0, 0, 0, 3.0, 0.6, 3.0, 'stone');
R('rubbleMid1', -4.4, 0, -4.4, 0.9, 0.3, 0.9, 'stone', { step: true });
R('rubbleMid2', 4.4, 0, 4.4, 0.9, 0.3, 0.9, 'stone', { step: true });
// north lane ("long"): its south wall with two 2.75 openings to the wings and the 6-wide gap onto the north arch approach
[[-20, -11], [-8, -3], [3, 8], [11, 20]].forEach(([a, b], i) => R('laneN' + i, (a + b) / 2, L, 7.5, b - a, 2.4, 0.5, 'sandstone'));
for (const s of [-1, 1]) {                                                                   // the two peeking alcoves: pier pairs off the north wall
  R('pier' + (s < 0 ? 'W' : 'E') + 'a', s * 13.45, L, 13.0, 0.5, 3.0, 2.0, 'sandstone');
  R('pier' + (s < 0 ? 'W' : 'E') + 'b', s * 10.55, L, 13.0, 0.5, 3.0, 2.0, 'sandstone');
}
R('crateA', -8.0, L, 13.4, 1.2, 1.2, 1.2, 'wood');
R('crateHopN', -6.8, L, 13.4, 1.2, 0.6, 1.2, 'wood');
R('crateB', 5.0, L, 8.35, 1.2, 1.2, 1.2, 'wood');
R('crateC', 14.3, L, 13.4, 1.2, 1.2, 1.2, 'wood');                                          // flush against the east pier
R('stall', 0, L, 10.8, 2.4, 1.0, 1.6, 'woodDark');                                          // the market counter; the north ammo crate sits on it
// south lane ("tunnel"): wall with three 1.6 openings, a ceiling slab from x −14 to 14, two crate stacks, a barrel row at x 0
[[-20, -8.8], [-7.2, -0.8], [0.8, 7.2], [8.8, 20]].forEach(([a, b], i) => R('laneS' + i, (a + b) / 2, L, -7.5, b - a, 3.0, 0.5, 'sandstone'));
R('ceiling', 0, L + 3.0, -10.625, 28, 0.4, 6.75, 'sandstoneDark');
[-13.55, -12.65, -11.75].forEach((z, i) => R('barrel' + i, 0, L, z, 0.62, 1.0, 0.9, 'barrel', { metal: true, hidden: true }));   // touching, flush to the south wall; hidden = collider only, the DECO cylinders are the look
R('stackW0', -5, L, -13.4, 1.2, 1.2, 1.2, 'wood');
R('stackW1', -5, L + 1.2, -13.4, 1.2, 0.6, 1.2, 'woodDark');
R('stackE0', 6, L, -8.35, 1.2, 1.2, 1.2, 'wood');
R('stackE1', 6, L + 1.2, -8.35, 1.2, 0.6, 1.2, 'woodDark');
// wings: a cross wall with an arch splits each wing into an inner alley and an outer yard; balcony + 12-rise stair on the outer wall
for (const s of [-1, 1]) {
  const p = s < 0 ? 'W' : 'E';
  R('cross' + p + 'n', s * 11, L, 4.625, 0.5, 2.4, 5.25, 'sandstone');                        // z 2..7.25
  R('cross' + p + 's', s * 11, L, -4.625, 0.5, 2.4, 5.25, 'sandstone');
  R('archW' + p + 'a', s * 11, L, 1.75, 0.5, 3.5, 0.5, 'stone');
  R('archW' + p + 'b', s * 11, L, -1.75, 0.5, 3.5, 0.5, 'stone');
  R('archW' + p + 'lintel', s * 11, L + 3.5, 0, 0.6, 0.5, 4.0, 'stone');
  R('balcony' + p, s * 17.5, L, 0, 5, 2.4, 3, 'sandstoneDark');                                // top at 3.4: the AWP spot
  for (let k = 1; k <= 11; k++) R('bstair' + p + k, s * 19.25, L, 1.7 + 0.4 * (11 - k), 1.5, 0.2 * k, 0.4, 'stone', { step: true });   // z 1.5..5.9, the balcony is rise 12
  R('planter' + p, s * 11.85, L, 4.5, 1.2, 1.2, 2.4, 'pot');
  R('hopPlanter' + p, s * 13.05, L, 4.5, 1.2, 0.6, 1.2, 'wood');                             // flush to the planter: hop 0.6, then 0.6 onto it
  R('rubble' + p, s * 14.5, L, -6.85, 1.2, 0.3, 0.8, 'stone', { step: true });
}
export const MAP = MAP_ROWS;

/* ── deco (no colliders). The blockout is a night city block: concrete, steel, sodium light.
   Everything here is the *look* of a MAP collider or free dressing; nothing here stops a bullet or a body.
   `mat:'glow'` is the one unlit material — lamp lenses, lit windows, sign faces — and every real light
   source in LIGHTS sits inside one of them. ── */
const DECO_LIST = [];
const D = (kind, mat, x, y, z, o) => { DECO_LIST.push(Object.assign({ kind, mat, x, y, z }, o || {})); };
const LIGHT_LIST = [];
const LI = (x, y, z, color, intensity, dist) => { LIGHT_LIST.push({ x, y, z, color, intensity, dist }); };

// roof coping along the four wall tops, with a vent box every fifth bay
let cap = 0;
for (let x = -19.8; x <= 19.81; x += 1.2) {
  D('box', 'sandstoneDark', x, 5.2, 14.25, { w: 1.2, h: 0.36, d: 0.62 }); D('box', 'sandstoneDark', x, 5.2, -14.25, { w: 1.2, h: 0.36, d: 0.62 });
  if (cap % 5 === 2) { D('box', 'metal', x, 5.6, 14.25, { w: 0.7, h: 0.44, d: 0.62 }); D('box', 'metal', x, 5.6, -14.25, { w: 0.7, h: 0.44, d: 0.62 }); }
  cap++;
}
for (let z = -13.2; z <= 13.21; z += 1.2) {
  D('box', 'sandstoneDark', -20.25, 5.2, z, { w: 0.62, h: 0.36, d: 1.2 }); D('box', 'sandstoneDark', 20.25, 5.2, z, { w: 0.62, h: 0.36, d: 1.2 });
}

/* a sodium street lamp: plinth, tapered pole, a short arm over the walkway, a hooded lantern with a lit lens.
   `dx/dz` is the direction the arm reaches; the lens is what LIGHTS lights from. */
function lamp(x, y, z, h, dx, dz) {
  const ax = dx * 0.85, az = dz * 0.85;
  D('cyl', 'stone', x, y + 0.09, z, { r: 0.24, r2: 0.28, h: 0.18, n: 8 });
  D('cyl', 'metal', x, y + h / 2 + 0.15, z, { r: 0.055, r2: 0.1, h, n: 8 });
  D('box', 'metal', x + ax * 0.5, y + h + 0.14, z + az * 0.5, { w: dx ? 0.85 : 0.07, h: 0.07, d: dz ? 0.85 : 0.07 });
  D('box', 'metal', x + ax, y + h + 0.06, z + az, { w: 0.34, h: 0.14, d: 0.5, rot: [dz * 0.12, 0, -dx * 0.12] });
  D('box', 'glow', x + ax, y + h - 0.03, z + az, { w: 0.28, h: 0.04, d: 0.42 });
  LI(x + ax, y + h - 0.1, z + az, '#ffa441', 2.6, 13);
}
/* a bare city tree in a grate: trunk plus four stubby limbs. Winter-dead on purpose — no soft canopy. */
function tree(x, y, z, h) {
  D('box', 'stone', x, y + 0.02, z, { w: 1.1, h: 0.06, d: 1.1 });
  D('cyl', 'palmTrunk', x, y + h / 2, z, { r: 0.1, r2: 0.17, h, n: 7 });
  for (let i = 0; i < 5; i++) {
    const a = i * 1.257 + 0.4, dx = Math.sin(a), dz = Math.cos(a);
    D('box', 'palmTrunk', x + dx * 0.5, y + h * 0.82 + i * 0.12, z + dz * 0.5, { w: 0.07, h: 0.07, d: 1.1, rot: [0.5, a, 0] });
    D('box', 'palmLeaf', x + dx * 0.95, y + h * 0.95 + i * 0.12, z + dz * 0.95, { w: 0.75, h: 0.22, d: 0.75 });
  }
}
/* a wheelie dumpster over one of the barrel colliders (0.62 × 0.9 at the base, 1.0 high) */
function dumpster(x, y, z) {
  D('box', 'barrel', x, y + 0.52, z, { w: 0.6, h: 0.86, d: 0.86 });
  D('box', 'barrel', x, y + 0.98, z + 0.06, { w: 0.64, h: 0.07, d: 0.9, rot: [-0.06, 0, 0] });
  D('box', 'metal', x, y + 0.13, z, { w: 0.64, h: 0.1, d: 0.2 });
  for (const s of [-1, 1]) D('cyl', 'metal', x + s * 0.27, y + 0.07, z + 0.32, { r: 0.07, h: 0.06, n: 8, rot: [0, 0, 1.5708] });
}
/* a traffic cone with its reflective band */
function cone(x, y, z) { D('box', 'awning', x, y + 0.02, z, { w: 0.34, h: 0.04, d: 0.34 }); D('cone', 'awning', x, y + 0.3, z, { r: 0.15, h: 0.56, n: 8 }); D('cyl', 'awning2', x, y + 0.32, z, { r: 0.105, h: 0.09, n: 8 }); }
/* a kerbside bin */
function bin(x, y, z, r, h) { D('cyl', 'metal', x, y + h / 2, z, { r, r2: r * 0.86, h, n: 10 }); D('cyl', 'sandstoneDark', x, y + h + 0.03, z, { r: r * 1.08, h: 0.06, n: 10 }); }
/* an air-conditioning unit bolted to a wall, `face` = the wall normal it hangs off */
function ac(x, y, z, fx, fz) {
  D('box', 'metal', x, y, z, { w: fz ? 0.7 : 0.42, h: 0.5, d: fz ? 0.42 : 0.7 });
  D('box', 'sandstoneDark', x + fx * 0.23, y, z + fz * 0.23, { w: fz ? 0.56 : 0.02, h: 0.36, d: fz ? 0.02 : 0.56 });
}
/* a lit window: a dark recess with a warm pane, hung on a wall face */
function window_(x, y, z, w, h, fx, fz, lit) {
  D('box', 'brickDark', x, y, z, { w: fz ? w + 0.16 : 0.06, h: h + 0.16, d: fz ? 0.06 : w + 0.16 });
  D('box', lit ? 'glowWin' : 'glass', x + fx * 0.05, y, z + fz * 0.05, { w: fz ? w : 0.03, h, d: fz ? 0.03 : w });
  if (lit) LI(x + fx * 0.8, y, z + fz * 0.8, '#ffbe72', 0.5, 5);
}

// ── the centre: a utility island where the fountain used to be. The basin collider is its kerb.
D('torus', 'stone', 0, 0.6, 0, { r: 1.5, r2: 0.13, n: 8 });
D('cyl', 'water', 0, 0.61, 0, { r: 1.15, h: 0.02, n: 24 });                       // standing water, never drains
D('cyl', 'metal', 0, 1.2, 0, { r: 0.11, r2: 0.14, h: 1.2, n: 8 });                // standpipe
D('torus', 'metal', 0, 1.72, 0, { r: 0.26, r2: 0.03, n: 10 });                    // the cage around the lamp
D('sphere', 'glow', 0, 1.86, 0, { r: 0.13 });
LI(0, 1.86, 0, '#ffb347', 1.5, 9);
D('cyl', 'stone', 0, 0.63, 1.05, { r: 0.34, h: 0.04, n: 12 });                    // a manhole in the island
D('cyl', 'stone', 0, 0.63, -1.05, { r: 0.34, h: 0.04, n: 12 });

// ── street lamps and trees. Two light the pit from the old rubble heaps; the rest stand on the terraces.
lamp(-4.4, 0.3, -4.4, 4.0, 1, 0); lamp(4.4, 0.3, 4.4, 4.0, -1, 0);
lamp(-19.3, L, 13.3, 3.6, 1, 0); lamp(19.3, L, 13.3, 3.6, -1, 0);
lamp(-19.3, L, -6.4, 3.4, 1, 0); lamp(19.3, L, -6.4, 3.4, -1, 0);
lamp(-8.0, L, 5.9, 3.2, 0, -1); lamp(8.0, L, -5.9, 3.2, 0, 1);
tree(-15.5, L, 12.2, 3.1); tree(15.5, L, 12.2, 2.9); tree(-15.5, L, -12.2, 2.8);

// ── the kiosk over the market counter: steel posts, a corrugated canopy, a lit sign strip, a shutter
for (const [x, z] of [[-1.35, 9.85], [1.35, 9.85], [-1.35, 11.75], [1.35, 11.75]]) D('cyl', 'metal', x, L + 1.1, z, { r: 0.045, h: 2.2, n: 6 });
D('box', 'tarp', 0, L + 2.25, 10.8, { w: 3.1, h: 0.08, d: 2.3, rot: [-0.1, 0, 0] });
for (let x = -1.4; x <= 1.41; x += 0.28) D('box', 'metal', x, L + 2.31, 10.8, { w: 0.06, h: 0.06, d: 2.3, rot: [-0.1, 0, 0] });   // corrugation
D('box', 'sandstoneDark', 0, L + 1.72, 9.92, { w: 2.6, h: 0.44, d: 0.1 });                                // fascia over the counter
D('box', 'glow', 0, L + 1.72, 9.85, { w: 1.5, h: 0.14, d: 0.03 });
LI(0, L + 1.6, 9.5, '#ffd9a0', 0.9, 7);
D('box', 'awning', 0, L + 0.55, 11.62, { w: 2.3, h: 1.1, d: 0.06 });                                      // the shutter behind the counter
for (let x = -1.1; x <= 1.11; x += 0.16) D('box', 'rust', x, L + 0.55, 11.58, { w: 0.05, h: 1.1, d: 0.03 });
for (const [x, z, r] of [[-0.8, 10.5, 0.16], [-0.45, 11.2, 0.12], [0.9, 11.1, 0.14]]) D('cyl', 'metal', x, L + 1.15, z, { r, r2: r * 0.8, h: 0.3, n: 8 });

// ── cables strung over the north lane, with a bare bulb hanging off each
for (const x of [-14, 10.5]) {
  D('box', 'stone', x, 4.7, 10.875, { w: 0.04, h: 0.04, d: 6.25 });
  [8.9, 11.9].forEach(z => {
    D('box', 'stone', x, 4.5, z, { w: 0.02, h: 0.42, d: 0.02 });
    D('cone', 'metal', x, 4.24, z, { r: 0.13, h: 0.14, n: 8, rot: [Math.PI, 0, 0] });
    D('sphere', 'glow', x, 4.14, z, { r: 0.07 });
    LI(x, 4.1, z, '#ffc98a', 1.0, 8);
  });
}

// ── the dumpster row against the south wall, over the three barrel colliders
for (const z of [-13.55, -12.65, -11.75]) dumpster(0, L, z);

// ── kerbside clutter where the pots used to stand: cones, bins, a stack of pallets
for (const s of [-1, 1]) {
  cone(s * 19.6, L, 8.4); cone(s * 19.1, L, 8.9);
  bin(s * 14.0, L, 12.6, 0.24, 0.62);
  bin(s * 6.0, L, 6.6, 0.26, 0.66);
  cone(s * 5.6, L, 6.15);
  bin(s * 19.6, L, -8.6, 0.22, 0.56);
  D('box', 'palmLeaf', s * 11.85, L + 1.32, 4.5, { w: 1.02, h: 0.26, d: 2.2 });                           // the planter's shrub
  D('box', 'pot', s * 11.85, L + 1.22, 4.5, { w: 1.28, h: 0.1, d: 2.48 });                                // its coping
  for (let k = 0; k < 3; k++) D('box', 'woodDark', s * 17.6, L + 2.46 + k * 0.14, -3.2, { w: 1.1, h: 0.1, d: 0.9 });   // pallets on the balcony
}

// ── the walls stop being blank: lit windows, air conditioners, a fire ladder, roller shutters
for (const z of [-11.5, -4.5, 3.5, 11.5]) {
  window_(-19.95, 3.3, z, 0.8, 1.0, 1, 0, z === -4.5 || z === 11.5);
  window_(19.95, 3.3, z, 0.8, 1.0, -1, 0, z === 3.5);
}
for (const x of [-14.5, -6.5, 6.5, 14.5]) {
  window_(x, 3.5, 13.95, 0.9, 1.1, 0, -1, x === -6.5 || x === 14.5);
  window_(x, 3.5, -13.95, 0.9, 1.1, 0, 1, x === 6.5);
}
ac(-19.7, 2.2, 6.5, 1, 0); ac(19.7, 2.2, -2.5, -1, 0); ac(-9.5, 2.4, 13.9, 0, -1); ac(11.5, 2.4, -13.9, 0, 1);
for (let k = 0; k < 9; k++) D('box', 'metal', -19.9, 1.4 + k * 0.34, -9.4, { w: 0.06, h: 0.05, d: 0.52 });   // fire-ladder rungs
for (const s of [-1, 1]) { D('box', 'metal', -19.9, 3.0, -9.4 + s * 0.28, { w: 0.06, h: 3.4, d: 0.06 }); }
D('box', 'rust', 16.5, 2.0, 13.95, { w: 3.0, h: 2.4, d: 0.08 });                                          // a shutter down over a shopfront
for (let y = 0.9; y <= 3.11; y += 0.18) D('box', 'awning', 16.5, y, 13.9, { w: 2.9, h: 0.09, d: 0.04 });
export const DECO = DECO_LIST;
/* point lights the arena carries. The engine drops the dimmest ones first on low quality. */
export const LIGHTS = LIGHT_LIST;

/* ── signs: few, generic. Painted letters on the lane walls, a wordless board over the stall ── */
export const SIGNS = [
  // callouts, sprayed on the lane walls the way a real map labels its sites
  { id: 'laneA', text: 'A', x: -15.5, y: 3.0, z: 7.78, w: 1.3, h: 1.3, face: '+z', ink: '#d8d3c2', bg: 'none' },
  { id: 'laneB', text: 'B', x: 15.5, y: 3.0, z: -7.78, w: 1.3, h: 1.3, face: '-z', ink: '#d8d3c2', bg: 'none' },
  { id: 'noPark', text: 'NO PARKING', x: -10, y: 2.6, z: 7.78, w: 2.6, h: 0.5, face: '+z', ink: '#9aa2ab', bg: 'none' },
  { id: 'exit', text: 'FIRE EXIT', x: -19.95, y: 2.4, z: -9.4, w: 1.9, h: 0.42, face: '+x', ink: '#8fd6a0', bg: 'none' },
  { id: 'bay', text: 'LOADING BAY', x: 8, y: 2.4, z: -7.78, w: 2.6, h: 0.46, face: '-z', ink: '#9aa2ab', bg: 'none' },
  { id: 'keep', text: 'KEEP CLEAR', x: -5.5, y: 2.6, z: 7.24, w: 2.2, h: 0.42, face: '-z', ink: '#c8ccd2', bg: 'none' },
];

/* ── ground paint (metres, on the 44 × 32 sand canvas). Only the courtyard floor is visible — the terraces cover the rest —
   so the paint lives there: the mosaic circle, worn paths from the stairs and arches, two rugs, stains under the rubble.
   kinds: circle {x,z,r,color} · rect {x,z,w,d,color,rot?} · line {x1,z1,x2,z2,width,color} · rug {x,z,w,d,color,color2,rot?} · stain {x,z,r,color,alpha} */
export const GROUND = {
  w: 44, d: 32, texW: 1024, texH: 768,
  paint: [
    // the pit is a service yard: worn asphalt, a painted turning circle, bays, drains, oil
    { kind: 'circle', x: 0, z: 0, r: 4.7, color: '#2a2e35' },
    { kind: 'circle', x: 0, z: 0, r: 4.55, color: '#7d7a68', alpha: 0.55, ring: 0.16 },
    { kind: 'circle', x: 0, z: 0, r: 3.4, color: '#2e3239' },
    { kind: 'circle', x: 0, z: 0, r: 2.35, color: '#7d7a68', alpha: 0.45, ring: 0.14 },
    { kind: 'line', x1: -5.2, z1: 0, x2: -1.7, z2: 0, width: 0.16, color: '#8a8674', alpha: 0.6 },
    { kind: 'line', x1: 5.2, z1: 0, x2: 1.7, z2: 0, width: 0.16, color: '#8a8674', alpha: 0.6 },
    { kind: 'line', x1: 0, z1: 4.2, x2: 0, z2: 1.7, width: 0.16, color: '#8a8674', alpha: 0.6 },
    { kind: 'line', x1: 0, z1: -4.2, x2: 0, z2: -1.7, width: 0.16, color: '#8a8674', alpha: 0.6 },
    // two parking bays, hatched
    { kind: 'rect', x: -3.4, z: 3.4, w: 2.4, d: 1.5, color: '#8a8674', alpha: 0.22, rot: 0.3 },
    { kind: 'rect', x: 3.4, z: -3.4, w: 2.4, d: 1.5, color: '#8a8674', alpha: 0.22, rot: -0.2 },
    // oil, water, rubber
    { kind: 'stain', x: -4.2, z: -4.2, r: 1.3, color: '#101216', alpha: 0.5 },
    { kind: 'stain', x: 4.2, z: 4.2, r: 1.3, color: '#101216', alpha: 0.5 },
    { kind: 'stain', x: 1.9, z: -1.6, r: 0.9, color: '#39424a', alpha: 0.35 },
    { kind: 'stain', x: -2.2, z: 1.3, r: 0.7, color: '#39424a', alpha: 0.3 },
    { kind: 'stain', x: -4.6, z: 2.1, r: 1.0, color: '#0d0f12', alpha: 0.4 },
    { kind: 'stain', x: 4.9, z: -1.2, r: 0.8, color: '#0d0f12', alpha: 0.35 },
    // the two arch thresholds, kept light so you can read the opening from the pit
    { kind: 'rect', x: 0, z: 4.5, w: 1.6, d: 1.2, color: '#343941' },
    { kind: 'rect', x: 0, z: -4.5, w: 1.6, d: 1.2, color: '#343941' },
    // drains
    { kind: 'circle', x: -3.9, z: -0.6, r: 0.32, color: '#191c21' },
    { kind: 'circle', x: 3.9, z: 0.6, r: 0.32, color: '#191c21' },
  ],
};

/* ── waypoint graph ── */
const N = (id, x, y, z) => ({ id, x, y, z });
const NODE_LIST = [
  // north lane
  N('N1', -18, L, 10.9), N('N2', -12, L, 10.5), N('N3', -7, L, 10.9), N('N4', -3, L, 9.0), N('N4b', -3, L, 12.6),
  N('N5', 3, L, 9.0), N('N5b', 3, L, 12.6), N('N6', 7.5, L, 11.0), N('N7', 12, L, 10.5), N('N8', 18, L, 10.9),
  N('AN1', -12, L, 13.2), N('AN2', 12, L, 13.2),                                              // the alcoves
  N('ONW', -9.4, L, 7.5), N('ONE', 9.4, L, 7.5), N('AN', 0, L, 6.4),                             // lane openings, north arch approach
  // south tunnel
  N('S1', -18, L, -10.9), N('S2', -12.5, L, -10.5), N('S3', -7.5, L, -10.2), N('S4', -2.5, L, -9.6), N('S5', 2.5, L, -9.6),
  N('S6', 7.5, L, -10.2), N('S7', 12.5, L, -10.5), N('S8', 18, L, -10.9), N('TBW', -2.2, L, -12.6), N('TBE', 2.2, L, -12.6),
  N('OSW', -8, L, -7.5), N('OSC', 0, L, -7.5), N('OSE', 8, L, -7.5), N('AS', 0, L, -6.4),
  // mid (the pit) and the hop crates under the arches
  N('MN', 0, 0, 3.0), N('MS', 0, 0, -3.0), N('MW', -3.5, 0, 0), N('ME', 3.5, 0, 0),
  N('MNW', -3.2, 0, 3.2), N('MNE', 3.2, 0, 3.2), N('MSW', -3.2, 0, -3.2), N('MSE', 3.2, 0, -3.2),
  N('HN', 0, 0.6, 4.5), N('HS', 0, 0.6, -4.5),
  // descent stairs (top, mid-step)
  N('SWT', -7.8, L, 0), N('SWM', -6.25, 0.6, 0), N('SET', 7.8, L, 0), N('SEM', 6.25, 0.6, 0),
];
for (const s of [-1, 1]) {                                                                   // wings, mirrored
  const p = s < 0 ? 'W' : 'E';
  NODE_LIST.push(
    N('I' + p + 'N', s * 8, L, 4.6), N('I' + p + 'S', s * 8, L, -4.6),                          // inner alley
    N('A' + p, s * 11, L, 0),                                                                   // under the arch
    N('O' + p + 'N', s * 15.5, L, 4.4), N('O' + p + 'S', s * 15.5, L, -4.4), N('O' + p + 'C', s * 13.8, L, 0),   // outer yard
    N('K' + p + '0', s * 19.25, L, 6.6),                                                        // stair foot
    N('K' + p + '1', s * 19.25, L + 0.6, 4.9), N('K' + p + '2', s * 19.25, L + 1.2, 3.7),
    N('K' + p + '3', s * 19.25, L + 1.8, 2.5), N('K' + p + '4', s * 19.25, L + 2.2, 1.7),
    N('B' + p + '1', s * 18.8, L + 2.4, 0.6), N('B' + p + '2', s * 16.0, L + 2.4, -0.4),          // the balcony
  );
}
export const NODES = NODE_LIST;

const H = (a, b, kind, both) => ({ a, b, kind, both: !!both });
const HINTS = [
  H('SWT', 'SWM', 'ramp', true), H('SWM', 'MW', 'ramp', true), H('SET', 'SEM', 'ramp', true), H('SEM', 'ME', 'ramp', true),
  H('MN', 'HN', 'jump', false), H('HN', 'AN', 'ramp', true), H('AN', 'MN', 'drop', false),
  H('MS', 'HS', 'jump', false), H('HS', 'AS', 'ramp', true), H('AS', 'MS', 'drop', false),
];
for (const p of ['W', 'E']) {
  HINTS.push(H('K' + p + '0', 'K' + p + '1', 'ramp', true), H('K' + p + '1', 'K' + p + '2', 'ramp', true), H('K' + p + '2', 'K' + p + '3', 'ramp', true),
    H('K' + p + '3', 'K' + p + '4', 'ramp', true), H('K' + p + '4', 'B' + p + '1', 'ramp', true),
    H('B' + p + '2', 'O' + p + 'C', 'drop', false), H('B' + p + '2', 'O' + p + 'S', 'drop', false), H('B' + p + '1', 'O' + p + 'N', 'drop', false));
}
export const EDGE_HINTS = HINTS;
export const AUTOLINK = { maxDist: 7.5, maxDy: 0.7, rayHeights: [0.3, 1.0, 1.5], lateral: 0.35 };

export const SPAWNS = [
  { x: -18, y: L, z: 10.9 }, { x: 18, y: L, z: 10.9 }, { x: -18, y: L, z: -10.9 }, { x: 18, y: L, z: -10.9 },   // lane ends
  { x: -16.5, y: L, z: 5.5 }, { x: 16.5, y: L, z: 5.5 }, { x: -18, y: L, z: -5.5 }, { x: 18, y: L, z: -5.5 },   // wing corners
];
export const CRATES = [{ x: 0, y: L + 1.0, z: 10.8 }, { x: 0, y: L + 1.0, z: -12.65 }];   // on the stall counter and on the middle barrel
export const BOUNDS = { minX: -20, maxX: 20, minZ: -14, maxZ: 14 };

/* ── weapons ── */
const HALF_PI = Math.PI / 2;
const P = (kind, part, x, y, z, o) => Object.assign({ kind, part, x, y, z }, o || {});
export const WEAPONS = {
  knife: {
    // the owner's model: barrel along +x in the file, fitted to the length and grip anchor the primitive model used
    glb: { file: 'knife.glb', len: 0.33, grip: [0.18, 0.4] },
    id: 'knife', name: 'knife', slot: 3,
    melee: { slash: { dmg: 40, time: 0.45 }, stab: { dmg: 65, time: 1.0 }, reach: 1.6, arcDeg: 45, backstabDeg: 60, speedBonus: 0.25 },
    dmg: 40, headMul: 1, rpm: 133, auto: false, mag: 0, reserve: 0,
    spread: { base: 0, perShot: 0, max: 0, decay: 0 }, falloff: { from: 1.6, mul: 0 },
    reload: { total: 0, magOut: 0, magIn: 0, bolt: 0 },
    recoil: { pitch: 0, pitchAfter: 0, firstShots: 0, yawDrift: 0, kickVis: 2.0, kickPos: 0.08, roll: 0.02 }, switchTime: 0.15,
    sfx: { swing: 'knife_swing', hit: 'knife_hit', backstab: 'knife_backstab' },
    model: [
      P('box', 'handle', 0, 0, 0, { w: 0.022, h: 0.03, d: 0.1, skin: true }),
      P('box', 'guard', 0, 0, -0.055, { w: 0.024, h: 0.034, d: 0.01 }),
      P('box', 'guard', 0, 0.004, 0.055, { w: 0.03, h: 0.042, d: 0.008 }),
      P('box', 'blade', 0, 0.01, 0.13, { w: 0.004, h: 0.03, d: 0.14, skin: true }),
      P('box', 'blade', 0, 0.017, 0.225, { w: 0.004, h: 0.016, d: 0.08, rot: [0.18, 0, 0], skin: true }),
      P('box', 'blade', 0, 0.028, 0.09, { w: 0.006, h: 0.006, d: 0.04 }),
    ],
  },
  glock: {
    // the owner's model: barrel along +x in the file, fitted to the length and grip anchor the primitive model used
    glb: { file: 'glock.glb', len: 0.22, grip: [0.27, 0.5] },
    id: 'glock', name: 'Glock', slot: 2, dmg: 30, headMul: 3.5, rpm: 400, auto: false, mag: 20, reserve: 120,
    spread: { base: 0.55, perShot: 0.55, max: 3.0, decay: 8 }, falloff: { from: 30, mul: 0.8 },
    reload: { total: 2.1, magOut: 0.35, magIn: 1.2, bolt: 1.75 },   // marks sit where each real recording starts, so the parts play end to end
    recoil: { pitch: 0.006, pitchAfter: 0.006, firstShots: 0, yawDrift: 0, kickVis: 0.9, kickPos: 0.03, roll: 0.006 }, switchTime: 0.25, flash: 0.26,
    sfx: { shot: 'glock_shot', empty: 'empty', magOut: 'glock_magout', magIn: 'glock_magin', bolt: 'glock_bolt' },
    model: [
      P('box', 'slide', 0, 0.075, 0.06, { w: 0.03, h: 0.032, d: 0.19, skin: true }),
      P('box', 'body', 0, 0.046, 0.07, { w: 0.028, h: 0.028, d: 0.12, skin: true }),
      P('box', 'grip', 0, -0.03, -0.012, { w: 0.03, h: 0.115, d: 0.05, rot: [0.26, 0, 0], skin: true }),
      P('box', 'guard', 0, 0.006, 0.05, { w: 0.02, h: 0.006, d: 0.045 }),
      P('box', 'body', 0, 0.022, 0.036, { w: 0.005, h: 0.02, d: 0.006 }),
      P('box', 'mag', 0, -0.09, -0.03, { w: 0.032, h: 0.01, d: 0.052, rot: [0.26, 0, 0] }),
      P('box', 'sight', 0, 0.095, 0.15, { w: 0.006, h: 0.008, d: 0.008 }),
      P('box', 'sight', 0, 0.095, -0.025, { w: 0.02, h: 0.008, d: 0.008 }),
      P('cyl', 'barrel', 0, 0.075, 0.157, { r: 0.006, l: 0.012, rot: [HALF_PI, 0, 0] }),
    ],
  },
  ar: {
    // the owner's model: barrel along +x in the file, fitted to the length and grip anchor the primitive model used
    glb: { file: 'ar.glb', len: 0.83, grip: [0.34, 0.52] },
    id: 'ar', name: 'AR', slot: 1, dmg: 33, headMul: 4, rpm: 666, auto: true, mag: 30, reserve: 90,
    spread: { base: 0.35, perShot: 0.28, max: 3.0, decay: 6 }, falloff: { from: 30, mul: 0.85 },
    reload: { total: 2.9, magOut: 0.35, magIn: 1.15, bolt: 2.25 },
    recoil: { pitch: 0.007, pitchAfter: 0.004, firstShots: 4, yawDrift: 0.003, kickVis: 1.4, kickPos: 0.05, roll: 0.008 }, switchTime: 0.4, flash: 0.36,
    sfx: { shot: 'ar_shot', empty: 'empty', magOut: 'ar_magout', magIn: 'ar_magin', bolt: 'ar_bolt' },
    model: [
      P('box', 'body', 0, 0.06, 0.05, { w: 0.04, h: 0.05, d: 0.22, skin: true }),                      // upper receiver
      P('box', 'body', 0, 0.02, 0.02, { w: 0.04, h: 0.045, d: 0.14, skin: true }),                     // lower receiver
      P('box', 'sight', 0, 0.1, 0.02, { w: 0.02, h: 0.035, d: 0.14 }),                                 // carry handle
      P('box', 'sight', 0, 0.125, -0.02, { w: 0.025, h: 0.015, d: 0.02 }),                             // rear aperture
      P('box', 'sight', 0, 0.095, 0.3, { w: 0.012, h: 0.05, d: 0.02 }),                                // front sight post
      P('box', 'mag', 0, -0.06, 0.05, { w: 0.028, h: 0.16, d: 0.06, rot: [0.1, 0, 0], skin: true }),   // straight mag
      P('cyl', 'body', 0, 0.06, 0.26, { r: 0.022, l: 0.2, rot: [HALF_PI, 0, 0], skin: true }),         // round handguard
      P('box', 'grip', 0, -0.005, 0.24, { w: 0.03, h: 0.07, d: 0.03, skin: true }),                    // vertical foregrip
      P('cyl', 'barrel', 0, 0.06, 0.44, { r: 0.008, l: 0.16, rot: [HALF_PI, 0, 0] }),
      P('cyl', 'barrel', 0, 0.06, 0.53, { r: 0.011, l: 0.04, rot: [HALF_PI, 0, 0] }),                  // muzzle device
      P('box', 'grip', 0, -0.04, -0.03, { w: 0.03, h: 0.09, d: 0.04, rot: [0.35, 0, 0], skin: true }), // pistol grip
      P('cyl', 'stock', 0, 0.055, -0.14, { r: 0.016, l: 0.18, rot: [HALF_PI, 0, 0], skin: true }),     // buffer tube
      P('box', 'stock', 0, 0.03, -0.24, { w: 0.035, h: 0.09, d: 0.08, skin: true }),                   // stock
      P('box', 'bolt', 0, 0.09, -0.06, { w: 0.03, h: 0.01, d: 0.04 }),                                 // charging handle
    ],
  },
  ak: {
    // the owner's model: barrel along +x in the file, fitted to the length and grip anchor the primitive model used
    glb: { file: 'ak.glb', len: 0.95, grip: [0.39, 0.59] },
    id: 'ak', name: 'AK-47', slot: 1, dmg: 36, headMul: 4, rpm: 600, auto: true, mag: 30, reserve: 90,
    spread: { base: 0.45, perShot: 0.36, max: 3.6, decay: 5 }, falloff: { from: 25, mul: 0.85 },
    reload: { total: 3.0, magOut: 0.3, magIn: 1.1, bolt: 2.05 },
    recoil: { pitch: 0.009, pitchAfter: 0.006, firstShots: 3, yawDrift: 0.005, kickVis: 1.7, kickPos: 0.06, roll: 0.012 }, switchTime: 0.45, flash: 0.42,
    sfx: { shot: 'ak_shot', empty: 'empty', magOut: 'ak_magout', magIn: 'ak_magin', bolt: 'ak_bolt' },
    model: [
      P('box', 'body', 0, 0.05, 0.02, { w: 0.045, h: 0.06, d: 0.24, skin: true }),                     // receiver
      P('box', 'body', 0, 0.085, 0.03, { w: 0.04, h: 0.015, d: 0.22, skin: true }),                    // dust cover
      P('box', 'wood', 0, 0.045, 0.22, { w: 0.045, h: 0.045, d: 0.16, skin: true }),                   // lower handguard
      P('box', 'wood', 0, 0.085, 0.22, { w: 0.035, h: 0.025, d: 0.12, skin: true }),                   // upper handguard
      P('cyl', 'body', 0, 0.1, 0.3, { r: 0.009, l: 0.14, rot: [HALF_PI, 0, 0] }),                      // gas tube
      P('cyl', 'barrel', 0, 0.06, 0.45, { r: 0.008, l: 0.2, rot: [HALF_PI, 0, 0] }),
      P('box', 'barrel', 0, 0.06, 0.56, { w: 0.02, h: 0.02, d: 0.04, rot: [0, 0, 0.4] }),              // slant brake
      P('box', 'sight', 0, 0.095, 0.47, { w: 0.012, h: 0.045, d: 0.015 }),                             // front post
      P('box', 'sight', 0, 0.105, 0.08, { w: 0.03, h: 0.012, d: 0.03 }),                               // rear leaf
      P('box', 'mag', 0, -0.03, 0.09, { w: 0.03, h: 0.06, d: 0.07, rot: [0.2, 0, 0], skin: true }),    // curved mag, three bricks
      P('box', 'mag', 0, -0.085, 0.075, { w: 0.03, h: 0.06, d: 0.07, rot: [0.42, 0, 0], skin: true }),
      P('box', 'mag', 0, -0.135, 0.05, { w: 0.03, h: 0.06, d: 0.07, rot: [0.65, 0, 0], skin: true }),
      P('box', 'wood', 0, -0.045, -0.06, { w: 0.03, h: 0.085, d: 0.04, rot: [0.35, 0, 0], skin: true }),   // grip
      P('box', 'wood', 0, 0.04, -0.24, { w: 0.04, h: 0.06, d: 0.26, rot: [0.1, 0, 0], skin: true }),   // stock, 6° down
      P('box', 'bolt', 0.03, 0.075, 0.0, { w: 0.02, h: 0.015, d: 0.03 }),                              // bolt handle, right side
    ],
  },
  awp: {
    // the owner's model: barrel along +x in the file, fitted to the length and grip anchor the primitive model used
    glb: { file: 'awp.glb', len: 1.14, grip: [0.31, 0.33] },
    id: 'awp', name: 'AWP', slot: 1, dmg: 115, headMul: 4, rpm: 41, auto: false, mag: 5, reserve: 30, bolt: 1.45,
    spread: { base: 5.0, perShot: 0, max: 5.0, decay: 0 }, falloff: { from: 999, mul: 1 },
    reload: { total: 3.4, magOut: 0.4, magIn: 1.5, bolt: 2.4 },
    recoil: { pitch: 0.03, pitchAfter: 0.03, firstShots: 0, yawDrift: 0, kickVis: 2.6, kickPos: 0.1, roll: 0.015 }, switchTime: 0.6, flash: 0.62,
    scope: { fovMul: 0.4, sensMul: 0.35, moveMul: 0.55, spread: 0.05, unscopeOnShot: true },
    sfx: { shot: 'awp_shot', bolt: 'awp_bolt', scope: 'scope', empty: 'empty', magOut: 'awp_magout', magIn: 'awp_magin' },
    model: [
      P('box', 'body', 0, 0.05, 0.05, { w: 0.045, h: 0.06, d: 0.3, skin: true }),                      // receiver
      P('cyl', 'barrel', 0, 0.07, 0.5, { r: 0.011, l: 0.5, rot: [HALF_PI, 0, 0], skin: true }),        // the long barrel
      P('cyl', 'barrel', 0, 0.07, 0.77, { r: 0.014, l: 0.05, rot: [HALF_PI, 0, 0] }),                  // muzzle
      P('cyl', 'scope', 0, 0.135, 0.02, { r: 0.02, l: 0.22, rot: [HALF_PI, 0, 0] }),                   // scope tube
      P('cyl', 'scope', 0, 0.135, 0.15, { r: 0.027, l: 0.06, rot: [HALF_PI, 0, 0] }),                  // objective bell
      P('torus', 'scope', 0, 0.135, 0.08, { r: 0.024, l: 0.006, rot: [0, 0, 0] }),                     // rings (torus r = ring radius, l = tube)
      P('torus', 'scope', 0, 0.135, -0.04, { r: 0.024, l: 0.006, rot: [0, 0, 0] }),
      P('box', 'mag', 0, -0.02, 0.11, { w: 0.03, h: 0.07, d: 0.07, skin: true }),
      P('box', 'grip', 0, -0.04, -0.02, { w: 0.03, h: 0.09, d: 0.04, rot: [0.3, 0, 0], skin: true }),
      P('box', 'stock', 0, 0.07, -0.2, { w: 0.035, h: 0.025, d: 0.26, skin: true }),                   // skeleton stock, upper bar
      P('box', 'stock', 0, 0.025, -0.33, { w: 0.035, h: 0.12, d: 0.03, skin: true }),                  // butt plate
      P('box', 'stock', 0, 0.1, -0.22, { w: 0.03, h: 0.03, d: 0.1 }),                                  // cheek rest
      P('cyl', 'body', -0.02, 0.045, 0.45, { r: 0.004, l: 0.16, rot: [HALF_PI, 0, 0] }),               // bipod, folded
      P('cyl', 'body', 0.02, 0.045, 0.45, { r: 0.004, l: 0.16, rot: [HALF_PI, 0, 0] }),
      P('cyl', 'bolt', 0.045, 0.085, -0.02, { r: 0.006, l: 0.05, rot: [0, 0, HALF_PI] }),              // bolt handle
      P('sphere', 'bolt', 0.07, 0.085, -0.02, { r: 0.01 }),
    ],
  },
};

/* ── skins ── */
const S = (id, name, weapon, rarity, desc, look) => ({ id, name, weapon, rarity, desc, look });
export const SKINS = [
  // stock, one per weapon, always owned, never stored
  S('stock_knife', 'stock', 'knife', 'stock', 'black handle, bare steel.', { base: '#2a2a30', accent: '#3a3a44', metal: '#a8adb8', pattern: 'plain' }),
  S('stock_glock', 'stock', 'glock', 'stock', 'polymer black.', { base: '#24262c', accent: '#2e3138', metal: '#5a5e68', pattern: 'plain' }),
  S('stock_ar', 'stock', 'ar', 'stock', 'anodised black.', { base: '#26282e', accent: '#33363e', metal: '#5a5e68', pattern: 'plain' }),
  S('stock_ak', 'stock', 'ak', 'stock', 'blued steel, wood furniture.', { base: '#2c2e34', accent: '#8a5a2a', metal: '#5a5e68', pattern: 'wood' }),
  S('stock_awp', 'stock', 'awp', 'stock', 'olive drab.', { base: '#4a5540', accent: '#3a4232', metal: '#5a5e68', pattern: 'plain' }),
  // glock (6)
  S('dust_runner', 'dust runner', 'glock', 'common', 'sand tan, matte.', { base: '#c9b48a', accent: '#a8905f', metal: '#6a6e78', pattern: 'plain' }),
  S('bone_white', 'bone white', 'glock', 'common', 'off-white frame, grey slide.', { base: '#e8e2d2', accent: '#8a8a90', metal: '#6a6e78', pattern: 'plain' }),
  S('hex_grid', 'hex grid', 'glock', 'uncommon', 'teal hex mesh over dark grey.', { base: '#243038', accent: '#3ab8b0', metal: '#6a6e78', pattern: 'hex' }),
  S('night_market', 'night market', 'glock', 'uncommon', 'orange stripes on charcoal.', { base: '#2a2a30', accent: '#e0762a', metal: '#6a6e78', pattern: 'stripes' }),
  S('petrol_sheen', 'petrol sheen', 'glock', 'rare', 'dark chrome with a purple film.', { base: '#1c1a26', accent: '#7a4fd0', metal: '#b8bcc8', pattern: 'chrome', emissive: '#3a1a6a' }),
  S('gilt_frame', 'gilt frame', 'glock', 'legendary', 'gold frame, black slide.', { base: '#e8c04a', accent: '#1e1e22', metal: '#f0d070', pattern: 'gold' }),
  // ar (6)
  S('field_olive', 'field olive', 'ar', 'common', 'three-tone green camo.', { base: '#5a6b3a', accent: '#3a4a2a', metal: '#5a5e68', pattern: 'camo' }),
  S('urban_slate', 'urban slate', 'ar', 'common', 'flat grey, lighter furniture.', { base: '#5a5f6a', accent: '#8a8f9a', metal: '#5a5e68', pattern: 'plain' }),
  S('hazard_stripe', 'hazard stripe', 'ar', 'uncommon', 'yellow and black diagonals.', { base: '#ffb020', accent: '#1e1e22', metal: '#5a5e68', pattern: 'stripes' }),
  S('trace_circuit', 'trace circuit', 'ar', 'uncommon', 'green traces on dark board.', { base: '#1a3028', accent: '#4ae08a', metal: '#5a5e68', pattern: 'hex', emissive: '#1a5a3a' }),
  S('carbon_weave', 'carbon weave', 'ar', 'rare', 'carbon fibre, gunmetal parts.', { base: '#1e2024', accent: '#3a3e46', metal: '#7a7e88', pattern: 'carbon' }),
  S('ember_core', 'ember core', 'ar', 'legendary', 'black marble veined with orange that glows.', { base: '#1a1416', accent: '#ff7a1a', metal: '#3a3438', pattern: 'marble', emissive: '#7a2a08' }),
  // ak (6)
  S('wood_grain', 'wood grain', 'ak', 'common', 'pale wood, all of it.', { base: '#c9a06a', accent: '#8a6a3a', metal: '#5a5e68', pattern: 'wood' }),
  S('jungle_canopy', 'jungle canopy', 'ak', 'common', 'deep green camo, dark wood.', { base: '#2f5a3a', accent: '#1e3a26', metal: '#5a5e68', pattern: 'camo' }),
  S('coral_reef', 'coral reef', 'ak', 'uncommon', 'pink and teal scales.', { base: '#e07a8a', accent: '#3ab8b0', metal: '#8a8f9a', pattern: 'scales' }),
  S('arctic_line', 'arctic line', 'ak', 'rare', 'white with thin ice-blue stripes.', { base: '#eef2f6', accent: '#6fb8d8', metal: '#a8adb8', pattern: 'stripes' }),
  S('tiger_stripe', 'tiger stripe', 'ak', 'rare', 'orange with black stripes.', { base: '#e0762a', accent: '#1e1e22', metal: '#5a5e68', pattern: 'stripes' }),
  S('midnight_chrome', 'midnight chrome', 'ak', 'legendary', 'blue-black chrome, wood gone dark.', { base: '#10142a', accent: '#2a5bd8', metal: '#c8ccd8', pattern: 'chrome', emissive: '#0a1a4a' }),
  // awp (5)
  S('grey_slate', 'grey slate', 'awp', 'common', 'flat slate grey.', { base: '#6a6e78', accent: '#4a4e58', metal: '#5a5e68', pattern: 'plain' }),
  S('glacier_melt', 'glacier melt', 'awp', 'uncommon', 'white marble with blue veins.', { base: '#e8eef4', accent: '#6fb8d8', metal: '#a8adb8', pattern: 'marble' }),
  S('static_noise', 'static noise', 'awp', 'uncommon', 'grey static, dark parts.', { base: '#9aa3ad', accent: '#2a2a30', metal: '#5a5e68', pattern: 'static' }),
  S('copper_wire', 'copper wire', 'awp', 'rare', 'polished copper body.', { base: '#b87333', accent: '#7a4a20', metal: '#d89a5a', pattern: 'chrome' }),
  S('onyx_gold', 'onyx gold', 'awp', 'legendary', 'black with gold inlay.', { base: '#141216', accent: '#e8c04a', metal: '#f0d070', pattern: 'gold', emissive: '#3a2a08' }),
  // knife tier (3)
  S('damascus', 'damascus', 'knife', 'knife', 'folded steel, wave pattern.', { base: '#8a8f9a', accent: '#2a2e36', metal: '#c8ccd8', pattern: 'damascus' }),
  S('frost_edge', 'frost edge', 'knife', 'knife', 'white marble blade, pale handle.', { base: '#e8eef4', accent: '#6fb8d8', metal: '#dfe6ee', pattern: 'marble', emissive: '#1a3a5a' }),
  S('obsidian', 'obsidian', 'knife', 'knife', 'black glass with a violet edge.', { base: '#0e0c14', accent: '#7a4fd0', metal: '#2a2632', pattern: 'chrome', emissive: '#2a1050' }),
];
const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.id, s]));
const CASE_SKIN_IDS = new Set(SKINS.filter(s => s.rarity !== 'stock').map(s => s.id));

export const CASES = {
  pitty: { id: 'pitty', name: 'pitty case', price: 80, odds: { common: 0.55, uncommon: 0.25, rare: 0.13, legendary: 0.06, knife: 0.01 }, scrapPerCase: 8 },
};
export const RARITY = {
  stock: { color: '#7d858f', label: 'stock' }, common: { color: '#9aa3ad', label: 'common' }, uncommon: { color: '#4b8ef0', label: 'uncommon' },
  rare: { color: '#a44be0', label: 'rare' }, legendary: { color: '#e8c04a', label: 'legendary' }, knife: { color: '#ffd23f', label: 'knife' },
};

/* ── bots: players, not people. Hoodie colours, none red ── */
/* `color` is the ACCENT, not the whole figure: everyone wears the same dark gear and the accent is the hood, the
   sleeves and the name plate. Saturated on purpose — it is the only thing that reads at 30 m on a night map. */
export const BOTS = [
  { name: 'toaster', color: '#e08a2a' }, { name: 'ph4ntom', color: '#8a4fe0' }, { name: 'zero_ping', color: '#16bdb4' },
  { name: 'capybara', color: '#b0742e' }, { name: 'wifi_off', color: '#6d7686' }, { name: 'n00b_slayer', color: '#2f78ff' },
  { name: 'afk', color: '#aab3bd' }, { name: 'sweat', color: '#ff5a1a' }, { name: 'bob', color: '#d8c25a' },
  { name: 'mom_said_no', color: '#ff3f86' }, { name: 'spinbot (not really)', color: '#3ee08a' }, { name: 'xXdarkXx', color: '#7b2fd0' },
];

/* ── difficulty knobs: reaction s, aim error E0 deg and its convergence T s, turn cap deg/s, fire-rate multiplier, burst gap s,
   hearing radius m, jump-strafe chance per decision, head-intent chance, ignore chance, retreat hp, primary draw per spawn ── */
export const DIFF = {
  // tuned down from the first numbers: with those, seven hard bots produced 348 kills in five minutes (a life lasted six seconds)
  easy: { reaction: 0.9, e0: 10.0, T: 2.6, turn: 150, fireMul: 0.4, burstGap: 1.0, hear: 12, jumpChance: 0.1, headIntent: 0, ignore: 0.25, retreatHp: 50, weaponWeights: { ar: 0.55, ak: 0.3, awp: 0.15 } },
  normal: { reaction: 0.65, e0: 7.0, T: 2.0, turn: 240, fireMul: 0.55, burstGap: 0.8, hear: 20, jumpChance: 0.2, headIntent: 0.1, ignore: 0.08, retreatHp: 40, weaponWeights: { ar: 0.45, ak: 0.3, awp: 0.25 } },
  hard: { reaction: 0.4, e0: 4.5, T: 1.4, turn: 380, fireMul: 0.75, burstGap: 0.55, hear: 28, jumpChance: 0.35, headIntent: 0.3, ignore: 0, retreatHp: 30, weaponWeights: { ar: 0.35, ak: 0.3, awp: 0.35 } },
};

/* ── copy: plain game UI. lowercase, short, dry. {a} {b} {w} {n} {m} {p} are placeholders ── */
export const LINES = {
  countdown: ['3', '2', '1'], go: 'go', suddenDeath: 'sudden death', loading: 'loading sandstone.',
  lockPrompt: 'click to play', touchPrompt: 'tap to play', lockDenied: 'click again', lockCooldown: 'one second',
  training: 'wasd moves. mouse aims. left click fires. r reloads. 1 2 3 switch weapons.',
  touchTraining: 'left thumb moves. right thumb aims. red button shoots.',
  touchFriction: 'aim sticks a little near targets. it does that for everyone.',
  portrait: 'rotate your phone',
  deathCard: 'killed by {a} · {w}', headTag: ' (headshot)', knifeTag: ' (knife)', respawnIn: 'respawn in {n}',
  emptyClick: 'reload', leaveConfirm: 'leave match? it counts as a loss.',
  pause: 'paused', pauseSub: 'click to resume', resume: 'resume', leave: 'leave', again: 'again', launcherBtn: 'launcher',
  endHeader: 'match over', placed: 'you placed {n} of {m}', records: 'new best: {n} kills', recordStreak: 'new best streak: {n}',
  total: 'matches don\'t pay. cases are in the launcher.',
  tampered: 'save check failed. inventory reset. cash untouched.',
  crash: 'pitty_striker.exe has stopped working.', crashKidding: 'kidding. loading.',
  crashReal: 'pitty_striker.exe has stopped working. it does that. try again.', tryAgain: 'try again',
  streak: { 3: 'triple', 5: 'rampage', 8: 'unstoppable', 10: 'godlike' },
  firstBlood: 'first blood', ammo: 'ammo',
  feed: { kill: '{a} killed {b}', unstick: '{n} reconnected' },
  botKill: ['gg', 'ez', '?', 'nice try', '1v1 me', 'sit', 'ok'],
  botDie: ['lag', 'nice shot', 'how', 'wall hacks', 'my mouse slipped', 'afk sorry'],
  launcher: {
    wordmark: 'PITTY STRIKER', version: 'v1.0',
    tabs: ['play', 'cases', 'inventory', 'stats', 'settings', 'quit'],
    play: {
      title: 'deathmatch · sandstone', bots: 'bots', diff: 'difficulty', diffs: { easy: 'easy', normal: 'normal', hard: 'hard' },
      primary: 'primary', skin: 'skin', go: 'play', small: 'first to 20 or 5:00. glock and knife always come along.',
    },
    cases: {
      title: 'cases', cash: '${n}', card: 'pitty case', open: 'open · ${p}', odds: 'odds', scrap: 'scrap {n}/8',
      recycle: 'recycle: 8 scrap → case', skip: 'skip', equip: 'equip', later: 'later', duplicate: 'duplicate. +1 scrap.',
      last: 'last drops', none: 'nothing yet.', free: 'open · free',
    },
    inventory: { title: 'inventory', equip: 'equip', equipped: 'equipped', owned: '{n} owned', skins: 'skins', scrap: 'scrap {n}', recycle: 'recycle', stock: 'stock' },
    stats: {
      title: 'stats',
      ranks: [[0, 'rookie'], [50, 'regular'], [200, 'veteran'], [500, 'sharp'], [1200, 'lethal'], [3000, 'legend']],
      next: 'next: {n} kills', top: 'top rank',
      labels: {
        rank: 'rank', matches: 'matches', wins: 'wins', kills: 'kills', deaths: 'deaths', kd: 'k/d', heads: 'headshots', acc: 'accuracy',
        bestKills: 'best kills', bestStreak: 'best streak', time: 'time played', wk: 'kills per weapon',
      },
    },
    settings: {
      title: 'settings', sens: 'sensitivity', fov: 'fov', scope: 'scope', scopeHold: 'hold', scopeToggle: 'toggle', invert: 'invert y',
      xhair: 'crosshair colour', xsize: 'crosshair size', btn: 'touch button size', friction: 'aim friction', tapFire: 'tap to fire',
      on: 'on', off: 'off', sizes: { s: 's', m: 'm', l: 'l' }, colors: { red: 'red', white: 'white', green: 'green', cyan: 'cyan' },
    },
    quit: 'quit',
  },
  hud: {
    reload: 'reload', dry: 'out of ammo', scoreboard: 'scoreboard', you: 'you', best: 'best',
    cols: { rank: 'rank', name: 'name', kills: 'kills', deaths: 'deaths', kd: 'k/d', streak: 'streak', weapon: 'weapon' },
  },
  closedToast: 'pitty_striker.exe closed. properly. for once.',
  notEnough: 'not enough. ${p}.',
};

/* ── sound table. key → layers [{f, rate:[lo,hi], gain, lp?, from?, dur?, at?, max?}] or {piano:'cue'}.
   `at` = seconds after the event, `max` = instances per second the engine should allow for that layer.
   A layer list may carry a {piano, at} entry too (die: the ko then the lose cue).

   Two families of recording, nothing synthesised. `F` is the six-file foley pack Overwork already
   used (impacts, footsteps, whooshes). `G` is the owner's gun pack: one real recording per gun
   event, so a shot is a shot and a reload is that gun's own magazine and bolt, not a pitched thud.
   The reload parts line up with WEAPONS[id].reload's magOut / magIn / bolt marks. ── */
const F = { hit1: 'art/sfx/hit1.wav', hit2: 'art/sfx/hit2.wav', ko: 'art/sfx/ko.wav', block: 'art/sfx/block.wav', armor: 'art/sfx/armor.wav', whoosh: 'art/sfx/whoosh.wav' };
const G = n => 'art/overwork/sfx-guns/' + n + '.mp3';
const Y = (f, lo, hi, gain, o) => Object.assign({ f: F[f], rate: [lo, hi], gain }, o || {});
const Z = (n, gain, o) => Object.assign({ f: G(n), rate: [0.98, 1.02], gain }, o || {});   // a real recording, played nearly straight
export const SFX = {
  glock_shot: [Z('glock_shot', 0.85, { max: 12 })],
  ar_shot: [Z('ar_shot', 0.8, { max: 14 })],
  ak_shot: [Z('ak_shot', 0.85, { max: 14 })],
  awp_shot: [Z('awp_shot', 1.0, { max: 4 })],
  glock_magout: [Z('glock_magout', 1.1)], glock_magin: [Z('glock_magin', 0.9)], glock_bolt: [Z('glock_bolt', 0.9)],
  ar_magout: [Z('ar_magout', 0.9)], ar_magin: [Z('ar_magin', 0.9)], ar_bolt: [Z('ar_bolt', 0.9)],
  ak_magout: [Z('ak_magout', 0.9)], ak_magin: [Z('ak_magin', 0.9)], ak_bolt: [Z('ak_bolt', 0.9)],
  awp_magout: [Z('awp_magout', 0.95)], awp_magin: [Z('awp_magin', 0.95)], awp_bolt: [Z('awp_bolt', 0.95)],
  scope: [Y('whoosh', 1.2, 1.2, 0.18, { dur: 0.1 })],
  knife_swing: [Y('whoosh', 1.3, 1.5, 0.35, { dur: 0.14 })],
  knife_hit: [Y('hit1', 0.8, 0.8, 0.6, { lp: 2500, dur: 0.15 })],
  knife_backstab: [Y('hit1', 0.55, 0.55, 0.8, { lp: 1800, dur: 0.25 })],
  empty: [Z('glock_dry', 0.7)],
  magOut: [Z('ar_magout', 0.85)],
  magIn: [Z('ar_magin', 0.85)],
  bolt: [Z('ar_bolt', 0.85)],
  slideLock: [Z('glock_lock', 0.8)],
  switch: [Y('armor', 1.0, 1.0, 0.3, { dur: 0.2 })],
  hit: [Y('block', 1.6, 1.6, 0.35, { dur: 0.08, max: 12 })],
  headshot: [Y('block', 2.2, 2.2, 0.35, { dur: 0.06 }), Y('armor', 1.5, 1.5, 0.3, { dur: 0.15 })],
  hurt: [Y('hit1', 0.7, 0.7, 0.5, { lp: 1200, dur: 0.2 })],
  whiz: [Y('whoosh', 1.4, 1.7, 0.3, { dur: 0.15 })],
  die: [Y('ko', 0.75, 0.75, 0.7), { piano: 'lose', at: 0.4 }],
  botDie: [Y('hit1', 0.5, 0.5, 0.25, { lp: 1500, dur: 0.2 })],
  crumb: [Y('hit1', 1.3, 1.3, 0.12, { dur: 0.08 })],
  worldHit: [Y('hit1', 1.0, 1.2, 0.25, { lp: 3000, dur: 0.12, max: 6 })],
  worldHitMetal: [Y('armor', 1.6, 1.9, 0.22, { dur: 0.1, max: 6 })],
  step: [Y('hit2', 0.3, 0.4, 0.18, { lp: 900, dur: 0.13 })],
  stepSprint: [Y('hit2', 0.36, 0.46, 0.22, { lp: 900, dur: 0.13 })],
  stepCrouch: [Y('hit2', 0.28, 0.34, 0.08, { lp: 900, dur: 0.13 })],
  stepStone: [Y('hit2', 0.42, 0.5, 0.18, { lp: 1400, dur: 0.13 })],
  jump: [Y('whoosh', 0.9, 0.9, 0.3, { dur: 0.2 })],
  land: [Y('hit1', 0.5, 0.6, 0.15, { lp: 2600, dur: 0.18 })],
  ammo: { piano: 'ding' },
  crateLid: [Y('block', 0.9, 0.9, 0.3, { dur: 0.12 })],
  count: { piano: 'count' }, start: { piano: 'start' }, kill: { piano: 'kill' }, streak: { piano: 'streak' },
  endWhistle: [Y('ko', 1.0, 1.0, 0.5)],
  endWin: { piano: 'win' }, endLose: { piano: 'lose' }, endMid: { piano: 'ding' },
  uiClick: [Y('block', 1.4, 1.7, 0.2, { lp: 4000, dur: 0.1 })],
  uiNo: [Y('block', 0.5, 0.5, 0.3, { lp: 1600, dur: 0.2 })],
  uiEquip: [Y('armor', 1.0, 1.0, 0.25, { dur: 0.15 })],
  reelTick: [Y('block', 1.5, 1.8, 0.15, { lp: 4000, dur: 0.06, max: 30 })],
  revealCommon: [Y('armor', 1.1, 1.1, 0.3, { dur: 0.2 })],
  revealRare: { piano: 'ding' },
  revealLegendary: { piano: 'win' },
};

/* ── save shape, signature, validation, the case roll ── */
export const PS_DEFAULT = {
  v: 2, owned: [], scrap: 0, cases: 0, eq: { knife: null, glock: null, ar: null, ak: null, awp: null },
  loadout: 'ar', diff: 'normal', bots: 5, seenTutorial: false, seenTouch: false, launches: 0,
  cfg: { sens: 10, fov: 80, scopeHold: true, invert: false, xhair: 'red', xsize: 1, btn: 'm', friction: true, tapFire: false },
  stats: { matches: 0, wins: 0, kills: 0, deaths: 0, heads: 0, shots: 0, hits: 0, bestKills: 0, bestStreak: 0, timeMs: 0, wk: { knife: 0, glock: 0, ar: 0, ak: 0, awp: 0 } },
  sig: '',
};

/* FNV-1a 32-bit over the sorted owned list + scrap + salt, base 36 — the same algorithm as Overwork's saveSig, its own input */
export function psSig(owned, scrap, salt) {
  const list = Array.isArray(owned) ? owned.map(String).sort().join(',') : '';
  const str = list + '|' + (scrap | 0) + '|' + salt;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, def, lo, hi) => (typeof v === 'number' && isFinite(v)) ? clamp(v, lo, hi) : def;
const bool = (v, def) => typeof v === 'boolean' ? v : def;
const nat = v => Math.max(0, v | 0);
const oneOf = (v, list, def) => list.includes(v) ? v : def;

/* Deep-validated copy of raw (any shape, any origin). tampered = the owned list or scrap was non-trivial and did not carry a
   matching signature → owned [], scrap 0, eq reset. Stats are not signed (they buy nothing). */
export function validatePS(raw, salt) {
  const ps = JSON.parse(JSON.stringify(PS_DEFAULT));
  let tampered = false;
  if (!raw || typeof raw !== 'object') { ps.sig = psSig(ps.owned, ps.scrap, salt); return { ps, tampered }; }
  const rawOwned = Array.isArray(raw.owned) ? raw.owned : [];
  const rawScrap = nat(raw.scrap);
  if ((rawOwned.length || rawScrap > 0) && raw.sig !== psSig(rawOwned, rawScrap, salt)) tampered = true;
  if (!tampered) {
    ps.owned = [...new Set(rawOwned.filter(id => typeof id === 'string' && CASE_SKIN_IDS.has(id)))];
    ps.scrap = rawScrap;
    const eq = raw.eq && typeof raw.eq === 'object' ? raw.eq : {};
    for (const w of Object.keys(ps.eq)) {
      const v = eq[w];
      ps.eq[w] = (typeof v === 'string' && ps.owned.includes(v) && SKIN_BY_ID[v].weapon === w) ? v : null;
    }
  }
  ps.cases = nat(raw.cases);
  ps.loadout = oneOf(raw.loadout, ['ar', 'ak', 'awp'], 'ar');
  ps.diff = oneOf(raw.diff, ['easy', 'normal', 'hard'], 'normal');
  ps.bots = typeof raw.bots === 'number' && isFinite(raw.bots) ? clamp(Math.round(raw.bots), 3, 7) : 5;
  ps.seenTutorial = bool(raw.seenTutorial, false);
  ps.seenTouch = bool(raw.seenTouch, false);
  ps.launches = nat(raw.launches);
  const c = raw.cfg && typeof raw.cfg === 'object' ? raw.cfg : {}, dc = PS_DEFAULT.cfg;
  ps.cfg = {
    sens: num(c.sens, dc.sens, 3, 20), fov: num(c.fov, dc.fov, 70, 100), scopeHold: bool(c.scopeHold, dc.scopeHold), invert: bool(c.invert, dc.invert),
    xhair: oneOf(c.xhair, ['red', 'white', 'green', 'cyan'], dc.xhair), xsize: num(c.xsize, dc.xsize, 0.5, 2), btn: oneOf(c.btn, ['s', 'm', 'l'], dc.btn),
    friction: bool(c.friction, dc.friction), tapFire: bool(c.tapFire, dc.tapFire),
  };
  const st = raw.stats && typeof raw.stats === 'object' ? raw.stats : {}, wk = st.wk && typeof st.wk === 'object' ? st.wk : {};
  for (const k of Object.keys(ps.stats)) if (k !== 'wk') ps.stats[k] = nat(st[k]);
  for (const k of Object.keys(ps.stats.wk)) ps.stats.wk[k] = nat(wk[k]);
  ps.sig = psSig(ps.owned, ps.scrap, salt);
  return { ps, tampered };
}

/* Pure: rnd() in [0,1). Draws the rarity by the case odds, then uniformly inside that rarity's pool (the knife tier is the knife skins). */
export function rollCase(caseId, rnd) {
  const c = CASES[caseId] || CASES.pitty, r = typeof rnd === 'function' ? rnd : Math.random;
  let roll = r(), rarity = 'common';
  for (const [k, p] of Object.entries(c.odds)) { if (roll < p) { rarity = k; break; } roll -= p; }
  let pool = SKINS.filter(s => s.rarity === rarity);
  if (!pool.length) { rarity = 'common'; pool = SKINS.filter(s => s.rarity === 'common'); }
  const skin = pool[Math.min(pool.length - 1, Math.floor(r() * pool.length))];
  return { skin, rarity };
}
