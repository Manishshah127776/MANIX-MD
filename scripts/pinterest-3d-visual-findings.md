# Pinterest 3D visual QA

- Local preview route: `http://127.0.0.1:4174/?qa=3d-local#home`
- The initial external Three.js CDN did not load in the preview, leaving `#scene-canvas` hidden.
- Three.js was vendored at `public/vendor/three.min.js` and the page script now uses the local asset.
- After reload, the hero visibly renders a cyan/violet wireframe globe with orbit rings, animated particles, nodes, and a pink pulse cube behind the MANI XMD phone mockup.
- Browser verification showed the three Pinterest-inspired reference images loaded successfully: phone JPG, globe JPG, and dashboard WEBP.
- The hero remains readable with the 3D canvas behind the phone and CTA content.
- `node scripts/validate-pairing-site.js`, JS syntax checks, command inventory audit, and `git diff --check` passed.
- The source includes a safe fallback that hides the canvas if WebGL or Three.js is unavailable, while preserving the static hero imagery and pairing UI.
- The asset note in the reference rail describes the images as inspiration/mood references and advises using licensed originals for commercial reuse.

## Deployment note

The local Three.js vendor and Pinterest-inspired assets must be committed with `public/index.html` so Render does not depend on the external CDN at runtime.
