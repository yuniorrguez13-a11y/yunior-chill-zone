Parasoul full-resolution runtime sprites

Source: Attack_WebP(1).zip and Others_WebP(1).zip supplied by the repository
owner as the corrected master export. The prior export had damaged colors and
was downscaled for runtime strips; those strips are intentionally retired.

Every frame used by the game now lives in art/parasoul/hq/*.zip. These archives
use ZIP's "stored" method: the original WebP bytes, resolution, alpha and color
data are preserved without another image conversion or compression pass. The
browser extracts and decodes the WebPs directly, loading idle/intro first and
streaming moves on demand through a bounded full-resolution frame cache.

All 1,484 files from the corrected master export are represented. Runtime packs
contain 1,511 entries because 27 shared Luger/Quake recovery frames are repeated
inside independent move archives; source01.zip through source20.zip retain the
supplied tech, alternate block/hit/intro and auxiliary-effect variants that do
not map to a separate state in the current combat engine.

The pack includes locomotion, turns, crouch transitions, blocks, hit reactions,
intro/win/taunt, all standing/crouching/aerial normals and command normals,
Napalm Shot/Toss/Quake variants, Egret Luger/Call, Snapback, Burst, Crimson
Hunting, Silent Scope and their supplied projectile/effect frames.

No license is asserted by this repository note; it records asset provenance and
the transformations (archive-only, no image transformation) used by the game.
