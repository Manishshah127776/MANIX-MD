const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(find, replace, label) {
  if (!html.includes(find)) throw new Error(`Missing patch anchor: ${label}`);
  html = html.replace(find, replace);
}

replaceOnce('<script src="/vendor/three.min.js"></script>', '<script defer src="/vendor/three.min.js"></script>', 'defer Three.js');
replaceOnce('</style>', `
    /* MANI XMD command-center upgrade */
    :root { --app-rail:228px; --surface-strong:rgba(11,24,41,.92); --surface-soft:rgba(255,255,255,.035); --focus:0 0 0 3px color-mix(in srgb,var(--cyan) 22%,transparent); }
    body { background:var(--bg); }
    .topbar { padding-left:var(--app-rail); }
    .navbar { margin-left:var(--app-rail); }
    .app-sidebar { position:fixed; inset:0 auto 0 0; z-index:35; width:var(--app-rail); padding:22px 14px 18px; border-right:1px solid var(--line); background:linear-gradient(180deg,color-mix(in srgb,var(--bg2) 94%,transparent),color-mix(in srgb,var(--bg) 97%,transparent)); }
    .sidebar-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 10px 18px; border-bottom:1px solid var(--line); }
    .sidebar-kicker { color:var(--muted); font:10px "DM Mono",monospace; letter-spacing:.12em; text-transform:uppercase; }
    .sidebar-live { display:flex; align-items:center; gap:5px; color:var(--green); font:9px "DM Mono",monospace; text-transform:uppercase; }
    .sidebar-live i { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 10px var(--green); }
    .sidebar-nav { display:grid; gap:4px; margin-top:18px; }
    .sidebar-link { display:flex; align-items:center; gap:11px; width:100%; padding:11px 10px; border:1px solid transparent; border-radius:12px; color:var(--muted); background:transparent; text-align:left; font-size:12px; transition:.2s; }
    .sidebar-link:hover,.sidebar-link.active { color:var(--text); border-color:color-mix(in srgb,var(--cyan) 26%,transparent); background:linear-gradient(90deg,color-mix(in srgb,var(--cyan) 12%,transparent),transparent); }
    .sidebar-link:focus-visible,.icon-btn:focus-visible,.primary-btn:focus-visible,.secondary-btn:focus-visible,.ghost-btn:focus-visible,.nav-link:focus-visible { outline:none; box-shadow:var(--focus); }
    .sidebar-icon { display:grid; place-items:center; width:25px; height:25px; border:1px solid var(--line); border-radius:8px; color:var(--cyan); font:9px "DM Mono",monospace; }
    .sidebar-foot { position:absolute; left:14px; right:14px; bottom:18px; padding-top:15px; border-top:1px solid var(--line); }
    .sidebar-foot p { margin:0 0 10px; color:var(--muted); font-size:10px; line-height:1.55; }
    .sidebar-settings { width:100%; }
    main,.footer { margin-left:var(--app-rail); }
    .overview-workbench { margin:6px auto 48px; padding:25px; border:1px solid var(--line); border-radius:26px; background:linear-gradient(135deg,color-mix(in srgb,var(--cyan) 6%,var(--panel)),color-mix(in srgb,var(--violet) 7%,var(--panel))); box-shadow:var(--shadow); }
    .overview-workbench .section-head { margin:0 0 20px; }
    .overview-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .overview-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:14px; }
    .overview-card { min-height:190px; padding:20px; border:1px solid var(--line); border-radius:18px; background:color-mix(in srgb,var(--bg2) 65%,transparent); }
    .overview-card h3 { margin:0; font-size:15px; }
    .overview-card .card-kicker { color:var(--muted); font:10px "DM Mono",monospace; letter-spacing:.09em; text-transform:uppercase; }
    .overview-status { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; margin-top:15px; }
    .overview-status strong { display:block; font-size:22px; letter-spacing:-.05em; }
    .overview-status span { display:block; margin-top:5px; color:var(--muted); font-size:12px; }
    .overview-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:20px; }
    .overview-metric { padding:11px; border:1px solid var(--line); border-radius:12px; background:var(--surface-soft); }
    .overview-metric b { display:block; font-size:13px; }
    .overview-metric span { display:block; margin-top:4px; color:var(--muted); font:9px "DM Mono",monospace; text-transform:uppercase; }
    .health-badge { display:inline-flex; align-items:center; gap:7px; padding:7px 9px; border:1px solid color-mix(in srgb,var(--green) 30%,transparent); border-radius:999px; color:var(--green); background:color-mix(in srgb,var(--green) 8%,transparent); font:9px "DM Mono",monospace; text-transform:uppercase; }
    .health-badge .status-dot { width:6px; height:6px; }
    .overview-quick { display:grid; gap:9px; margin-top:15px; }
    .quick-row { display:flex; justify-content:space-between; gap:12px; padding:11px 0; border-bottom:1px solid var(--line); color:var(--muted); font-size:11px; }
    .quick-row:last-child { border-bottom:0; }
    .quick-row b { color:var(--text); font:11px "DM Mono",monospace; text-align:right; }
    .pair-stepper { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:0 0 22px; }
    .pair-step { display:flex; align-items:center; gap:9px; padding:12px; border:1px solid var(--line); border-radius:13px; color:var(--muted); background:var(--surface-soft); font-size:11px; }
    .pair-step b { display:grid; place-items:center; flex:0 0 24px; width:24px; height:24px; border-radius:8px; color:var(--cyan); background:color-mix(in srgb,var(--cyan) 11%,transparent); font:10px "DM Mono",monospace; }
    .pair-step.active { color:var(--text); border-color:color-mix(in srgb,var(--cyan) 45%,transparent); background:color-mix(in srgb,var(--cyan) 9%,transparent); }
    .pair-step.complete b { color:#07111f; background:var(--green); }
    .scene-fallback-card { display:none; position:absolute; z-index:6; left:8%; right:8%; bottom:12%; padding:16px; border:1px solid var(--line); border-radius:15px; background:var(--surface-strong); box-shadow:var(--shadow); }
    .scene-fallback-card strong { display:block; font-size:13px; }
    .scene-fallback-card span { display:block; margin-top:5px; color:var(--muted); font-size:11px; line-height:1.5; }
    .visual-stage.scene-fallback .scene-fallback-card { display:block; }
    .visual-stage[data-connection-state="connected"] .scene-hud { color:var(--green); border-color:color-mix(in srgb,var(--green) 35%,transparent); }
    .visual-stage[data-connection-state="connected"] .scene-hud i { background:var(--green); box-shadow:0 0 12px var(--green); }
    .visual-stage[data-connection-state="error"] .scene-hud i { background:var(--danger); box-shadow:0 0 12px var(--danger); }
    .scene-controls { position:absolute; right:8%; bottom:4%; z-index:8; display:flex; gap:6px; }
    .scene-control { width:31px; height:31px; border:1px solid var(--line); border-radius:9px; color:var(--muted); background:var(--surface-strong); font:12px "DM Mono",monospace; }
    .scene-control:hover { color:var(--text); border-color:var(--cyan); }
    .health-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .health-value { margin-top:10px; font-size:24px; letter-spacing:-.05em; }
    .health-copy { margin:7px 0 0; color:var(--muted); font-size:12px; line-height:1.6; }
    .about-callout { display:grid; grid-template-columns:1fr .8fr; gap:18px; align-items:stretch; }
    .about-callout img { width:100%; height:100%; min-height:250px; object-fit:cover; border-radius:18px; border:1px solid var(--line); }
    .destructive-btn { color:var(--danger); border-color:color-mix(in srgb,var(--danger) 32%,transparent); }
    @media(max-width:970px){
      :root { --app-rail:0px; }
      .topbar,.navbar,main,.footer { margin-left:0; padding-left:0; }
      .app-sidebar { width:240px; transform:translateX(-102%); transition:transform .28s ease; box-shadow:var(--shadow); }
      .app-sidebar.open { transform:none; }
      .overview-grid,.about-callout { grid-template-columns:1fr; }
      .nav-links { z-index:42; }
    }
    @media(max-width:760px){ .overview-workbench { padding:17px; border-radius:20px; } .pair-stepper { grid-template-columns:repeat(2,1fr); } .health-grid { grid-template-columns:1fr; } .overview-metrics { grid-template-columns:1fr; } .scene-controls { right:5%; bottom:2%; } }
    @media(max-width:440px){ .pair-step { padding:10px 8px; font-size:10px; } .pair-step b { flex-basis:21px; width:21px; height:21px; } }
  </style>`, 'command-center CSS');

replaceOnce('</style>', `
    /* Responsive comfort pass */
    .mobile-dock { display:none; }
    .nav-link,.sidebar-link { min-height:42px; }
    .primary-btn,.secondary-btn,.ghost-btn,.seg-btn { min-height:42px; }
    .input,.country-trigger { min-height:46px; }
    @media (min-width:1200px) { .shell { width:min(1280px,calc(100% - 64px)); } .section { padding-top:88px; } .hero { gap:72px; } }
    @media (min-width:1500px) { .shell { width:min(1360px,calc(100% - 96px)); } .hero h1 { font-size:clamp(58px,5.1vw,84px); } }
    @media (max-width:970px) { body { padding-bottom:76px; } .nav-actions .primary-btn { display:none; } .mobile-dock { position:fixed; left:12px; right:12px; bottom:12px; z-index:60; display:grid; grid-template-columns:repeat(4,1fr); gap:5px; padding:7px; border:1px solid var(--line); border-radius:18px; background:color-mix(in srgb,var(--bg2) 92%,transparent); box-shadow:0 18px 50px rgba(0,0,0,.38); backdrop-filter:blur(20px); } .mobile-dock button { min-height:52px; padding:7px 4px; border:1px solid transparent; border-radius:12px; color:var(--muted); background:transparent; font:10px "DM Mono",monospace; } .mobile-dock button.active { color:var(--text); border-color:color-mix(in srgb,var(--cyan) 38%,transparent); background:color-mix(in srgb,var(--cyan) 10%,transparent); } }
    @media (max-width:760px) { .shell { width:min(calc(100% - 28px),620px); } .section { min-height:auto; padding:50px 0 42px; } .hero { min-height:auto; gap:12px; padding:38px 0 48px; } .hero h1 { font-size:clamp(42px,12.5vw,66px); } .hero-actions,.action-row { display:grid; grid-template-columns:1fr; gap:9px; } .hero-actions>*,.action-row>* { width:100%; } .visual-stage { min-height:445px; transform:scale(.9); margin:-22px -14px; } .visual-stage .float-card.three { display:none; } .overview-actions { display:grid; grid-template-columns:1fr; } .footer-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:520px) { .brand-copy { max-width:156px; font-size:14px; } .visual-stage { min-height:395px; transform:scale(.82); margin:-38px -29px; } .phone { width:218px; height:436px; } .footer-grid { grid-template-columns:1fr; } }
    @media (hover:none) { .primary-btn:hover,.ghost-btn:hover,.secondary-btn:hover,.seg-btn:hover,.reference-card:hover { transform:none; } }
  </style>`, 'responsive comfort CSS');
replaceOnce('<header class="navbar">', `<aside class="app-sidebar" id="app-sidebar" aria-label="Application navigation">
    <div class="sidebar-heading"><span class="sidebar-kicker">Workspace</span><span class="sidebar-live"><i></i> Live</span></div>
    <nav class="sidebar-nav" aria-label="Command center navigation">
      <button class="sidebar-link" data-route="home"><span class="sidebar-icon">01</span><span>Overview</span></button>
      <button class="sidebar-link" data-route="pair"><span class="sidebar-icon">02</span><span>Pairing</span></button>
      <button class="sidebar-link" data-route="bot"><span class="sidebar-icon">03</span><span>Bot controls</span></button>
      <button class="sidebar-link" data-route="commands"><span class="sidebar-icon">04</span><span>Commands</span></button>
      <button class="sidebar-link" data-route="docs"><span class="sidebar-icon">05</span><span>Documentation</span></button>
      <button class="sidebar-link" data-route="updates"><span class="sidebar-icon">06</span><span>Updates</span></button>
      <button class="sidebar-link" data-route="support"><span class="sidebar-icon">07</span><span>Support</span></button>
      <button class="sidebar-link" data-route="health"><span class="sidebar-icon">08</span><span>System health</span></button><button class="sidebar-link" data-route="about"><span class="sidebar-icon">09</span><span>About</span></button>
    </nav>
    <div class="sidebar-foot"><p>Live session controls for <strong>𝙼𝙰𝙽𝙸 𝚇𝙼𝙳</strong>. Pair only numbers and devices you own.</p><button class="ghost-btn sidebar-settings" id="sidebar-settings">Settings</button></div>
  </aside>
  <header class="navbar">`, 'application sidebar');

replaceOnce('</main>', '    <nav class="mobile-dock" aria-label="Quick navigation"><div class="dock-shine" aria-hidden="true"></div><button class="dock-item" data-route="home"><span class="dock-icon" aria-hidden="true">⌂</span><span class="dock-label">Overview</span></button><button class="dock-item" data-route="pair"><span class="dock-icon" aria-hidden="true">⌁</span><span class="dock-label">Pair</span></button><button class="dock-item" data-route="bot"><span class="dock-icon" aria-hidden="true">◈</span><span class="dock-label">Bot</span></button><button class="dock-item" data-route="commands"><span class="dock-icon" aria-hidden="true">⌕</span><span class="dock-label">Commands</span></button><button class="dock-item dock-settings" id="dock-settings" aria-label="Open settings"><span class="dock-icon" aria-hidden="true">⚙</span><span class="dock-label">Settings</span></button></nav>\n  </main>', 'mobile quick navigation');
replaceOnce('GLOBAL PAIRING SYSTEM · LEGITIMATE BACKEND SESSION', 'MANI XMD COMMAND CENTER · LIVE SESSION CONTROL', 'topbar product copy');
replaceOnce('WHATSAPP BOT PLATFORM', 'WHATSAPP BOT COMMAND CENTER', 'brand descriptor');
replaceOnce('<button class="nav-link" data-route="home">Home</button>', '<button class="nav-link" data-route="home">Overview</button>', 'top nav overview');
replaceOnce('<button class="nav-link" data-route="pair">Pair</button>', '<button class="nav-link" data-route="pair">Pairing</button>', 'top nav pairing');
replaceOnce('<button class="nav-link" data-route="bot">Bot</button>', '<button class="nav-link" data-route="bot">Bot controls</button>', 'top nav bot');
replaceOnce('<button class="nav-link" data-route="docs">Docs</button>', '<button class="nav-link" data-route="docs">Documentation</button>', 'top nav documentation');
replaceOnce('<button class="primary-btn" data-route="pair">Pair now</button>', '<button class="primary-btn" data-route="pair">Pair now</button>', 'pair now');

replaceOnce('<div class="reference-rail shell">', `<div class="shell overview-workbench" aria-labelledby="overview-title">
      <div class="section-head"><div><span class="eyebrow">Live operations</span><h2 id="overview-title" style="margin-top:10px">Connection <span class="gradient">overview.</span></h2></div><div class="overview-actions"><button class="primary-btn" data-route="pair">Open pairing center</button><button class="ghost-btn" data-route="health">View system health</button></div></div>
      <div class="overview-grid">
        <article class="overview-card"><div class="card-kicker">WhatsApp session</div><div class="overview-status"><div><strong id="overview-session-name">No session selected</strong><span id="overview-session-status">Waiting for a real backend session.</span></div><span class="health-badge"><i class="status-dot" id="overview-health-dot"></i><span id="overview-health-label">Backend ready</span></span></div><div class="overview-metrics"><div class="overview-metric"><b id="overview-last-activity">No activity yet</b><span>Last activity</span></div><div class="overview-metric"><b id="overview-uptime">Tracking</b><span>Session uptime</span></div><div class="overview-metric"><b id="overview-backend">Live feed</b><span>Backend health</span></div></div><div class="action-row"><button class="secondary-btn" id="overview-reconnect" data-control="reconnect">Reconnect</button><button class="ghost-btn" id="overview-disconnect" data-control="disconnect">Disconnect</button></div></article>
        <article class="overview-card"><div class="card-kicker">System signal</div><h3 id="overview-signal-title" style="margin-top:11px">Ready for a secure link</h3><div class="overview-quick"><div class="quick-row"><span>Connection mode</span><b id="overview-mode">QR + phone code</b></div><div class="quick-row"><span>Command inventory</span><b>730 unique labels</b></div><div class="quick-row"><span>Runtime target</span><b>24/7 Render service</b></div><div class="quick-row"><span>Multi-Device</span><b id="overview-md">Enabled</b></div></div><button class="secondary-btn" data-route="bot" style="margin-top:13px">Open bot controls</button></article>
      </div>
    </div>
    <div class="reference-rail shell">`, 'overview workbench');

replaceOnce('<div class="visual-stage" id="visual-stage" aria-label="Interactive bot pairing preview"><canvas', '<div class="visual-stage" id="visual-stage" data-connection-state="disconnected" aria-label="Interactive bot pairing preview"><canvas', 'visual state stage');
replaceOnce('<div class="scene-hud"><i></i><span>WEBGL LINK SCENE · SCROLL + POINTER ACTIVE</span></div>', '<div class="scene-hud"><i></i><span id="scene-hud-label">WEBGL LINK SCENE · LIVE SESSION STATE</span></div><div class="scene-controls" aria-label="3D view controls"><button class="scene-control" id="scene-zoom-out" aria-label="Zoom out" title="Zoom out">−</button><button class="scene-control" id="scene-reset" aria-label="Reset 3D view" title="Reset view">0</button><button class="scene-control" id="scene-zoom-in" aria-label="Zoom in" title="Zoom in">+</button></div><div class="scene-fallback-card"><strong>3D view unavailable</strong><span>The live pairing controls remain fully available. Enable WebGL or turn on 3D phone effects in Settings to restore the interactive view.</span></div>', 'scene controls and fallback');

replaceOnce('<div class="pair-layout">', '<div class="pair-stepper" aria-label="Pairing progress"><div class="pair-step active" id="pair-step-select"><b>01</b><span>Select method</span></div><div class="pair-step" id="pair-step-verify"><b>02</b><span>Verify</span></div><div class="pair-step" id="pair-step-pairing"><b>03</b><span>Pairing</span></div><div class="pair-step" id="pair-step-connected"><b>04</b><span>Connected</span></div></div><div class="pair-layout">', 'pairing stepper');
replaceOnce('<div class="section-head" style="margin-top:70px"><div><span class="eyebrow">Reliable by design</span>', '<div class="card" style="margin-top:18px"><div class="box-title"><div><span class="eyebrow">Runtime controls</span><h3 style="margin-top:9px">Operate the selected session safely</h3></div><span class="chip" id="bot-runtime-status">Waiting</span></div><p class="muted" style="font-size:12px;line-height:1.7">Actions below call the live session API. Start opens the pairing center; reconnect, restart, and stop use the selected session. Disruptive actions require confirmation.</p><div class="action-row"><button class="primary-btn" data-route="pair">Start / pair</button><button class="secondary-btn" data-control="reconnect">Reconnect</button><button class="ghost-btn" data-control="restart">Restart</button><button class="ghost-btn destructive-btn" data-control="disconnect">Stop session</button></div></div><div class="section-head" style="margin-top:70px"><div><span class="eyebrow">Reliable by design</span>', 'bot runtime controls');
replaceOnce('<button class="primary-btn" id="request-pairing-code">Generate real pairing code</button><button class="ghost-btn" id="copy-code" disabled>Copy code</button>', '<button class="primary-btn" id="request-pairing-code">Generate real pairing code</button><button class="ghost-btn" id="copy-code" disabled>Copy code</button><button class="ghost-btn" id="cancel-pairing">Cancel</button>', 'pairing cancel');
replaceOnce('<button class="secondary-btn" id="refresh-qr">Refresh live QR</button><button class="ghost-btn" data-route="docs">How to scan</button>', '<button class="secondary-btn" id="refresh-qr">Refresh live QR</button><button class="ghost-btn" id="cancel-qr">Cancel</button><button class="ghost-btn" data-route="docs">How to scan</button>', 'QR cancel');

replaceOnce('<section class="section" id="page-legal" data-page="legal">', `<section class="section" id="page-health" data-page="health"><div class="shell"><div class="section-head"><div><span class="eyebrow">Operational status</span><h2>System <span class="gradient">health.</span></h2></div><p>Live backend and session indicators from the same status feed used by the pairing center. No values are fabricated in the interface.</p></div><div class="health-grid"><article class="card"><span class="card-kicker">Backend</span><div class="health-value" id="health-backend">Checking…</div><p class="health-copy">Health endpoint and live status feed.</p></article><article class="card"><span class="card-kicker">WhatsApp</span><div class="health-value" id="health-session">Waiting…</div><p class="health-copy">Current active session connection state.</p></article><article class="card"><span class="card-kicker">Runtime</span><div class="health-value">24/7 target</div><p class="health-copy">Render process with keep-alive and Multi-Device support.</p></article></div><div class="grid-2" style="margin-top:18px"><div class="card"><div class="box-title"><h3>Live activity</h3><button class="ghost-btn" id="health-refresh">Refresh status</button></div><div class="activity" id="health-activity"><div class="activity-item"><span class="status-dot"></span><div><small>READY</small><p>Waiting for the first live event.</p></div></div></div></div><div class="card"><h3>Operational notes</h3><p class="muted" style="font-size:13px;line-height:1.8">Pairing codes and QR images are temporary. Session actions are sent to the backend only when a real session is selected. If WhatsApp is disconnected, the dashboard will show the exact current state rather than a simulated online label.</p><button class="secondary-btn" data-route="pair" style="margin-top:10px">Open pairing center</button></div></div></div></section>

    <section class="section" id="page-about" data-page="about"><div class="shell"><div class="section-head"><div><span class="eyebrow">Product identity</span><h2>Built around <span class="gradient">control.</span></h2></div><p>𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 is a branded WhatsApp bot platform for legitimate device pairing, fast command access, and observable session operations.</p></div><div class="about-callout"><div class="card"><h2 style="margin-top:0">One workspace for every linked number.</h2><p class="muted" style="font-size:14px;line-height:1.8">The platform keeps QR pairing, phone-number codes, Multi-Device sessions, command discovery, media workflows, and support guidance together in one responsive command center.</p><div class="kv"><div><b>730</b><span>unique commands</span></div><div><b>MD</b><span>multi-device</span></div><div><b>QR</b><span>real pairing</span></div><div><b>24/7</b><span>runtime target</span></div></div><div class="action-row"><a class="primary-btn" href="https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f" target="_blank" rel="noopener">WhatsApp channel</a><a class="ghost-btn" href="https://wa.me/9779807044421" target="_blank" rel="noopener">Contact owner</a></div></div><img src="/assets/professional-operations-dashboard.jpg" alt="MANI XMD operations dashboard visual" loading="lazy" /></div></div></section>

    <section class="section" id="page-legal" data-page="legal">`, 'health and about routes');

replaceOnce("const state = { activeSessionId: null, sessions: new Map(), codeExpiresAt: 0, qrExpiresAt: 0, country: null, socket: null, settings:", "const state = { activeSessionId: null, sessions: new Map(), codeExpiresAt: 0, qrExpiresAt: 0, country: null, socket: null, backend: null, settings:", 'state backend field');
replaceOnce("const allowed=['home','pair','bot','commands','docs','updates','support','dashboard','legal','maintenance']", "const allowed=['home','pair','bot','commands','docs','updates','support','dashboard','health','about','legal','maintenance']", 'route allowlist');
replaceOnce("if(next==='dashboard') renderDashboard(); window.scrollTo", "if(next==='dashboard') renderDashboard(); if(next==='health') renderHealth(); $('app-sidebar')?.classList.remove('open'); window.scrollTo", 'health route render');
replaceOnce("$('settings-open').addEventListener('click',openSettings); $('settings-footer').addEventListener('click',openSettings);", "$('settings-open').addEventListener('click',openSettings); $('settings-footer').addEventListener('click',openSettings); $('sidebar-settings').addEventListener('click',openSettings); $('dock-settings').addEventListener('click',openSettings);", 'sidebar settings handler');
replaceOnce("$('theme-toggle').addEventListener('click',()=>{state.settings.appearance=state.settings.appearance==='light'?'dark':'light';saveSettings();}); $('mobile-toggle').addEventListener('click',()=>$('nav-links').classList.toggle('open'));", "$('theme-toggle').addEventListener('click',()=>{state.settings.appearance=state.settings.appearance==='light'?'dark':'light';saveSettings();}); $('mobile-toggle').addEventListener('click',()=>{ $('nav-links').classList.toggle('open'); $('app-sidebar').classList.toggle('open'); });", 'mobile drawer handler');
replaceOnce("function displaySession(s){if(!s)return;", "function displaySession(s){if(!s)return;", 'display session anchor');
replaceOnce("if(s.connected&&!s._celebrated){s._celebrated=true;confetti();toast('WhatsApp session connected. Multi-Device is enabled.');addActivity(`Connected ${s.phoneNumber||s.sessionId}`);} }", "if(s.connected&&!s._celebrated){s._celebrated=true;confetti();toast('WhatsApp session connected. Multi-Device is enabled.');addActivity(`Connected ${s.phoneNumber||s.sessionId}`);} syncOverview();}", 'display session overview sync');
replaceOnce("async function loadStatus(){try{const response=await fetch('/status');const data=await response.json();", "async function loadStatus(){try{const response=await fetch('/status');const data=await response.json(); state.backend=data;", 'status state capture');
replaceOnce("$('system-status').textContent=data.whatsappConnected?'WhatsApp connected · Multi-Device enabled':'QR available · waiting for a linked device';}catch", "$('system-status').textContent=data.whatsappConnected?'WhatsApp connected · Multi-Device enabled':'QR available · waiting for a linked device'; syncOverview(); renderHealth();}catch", 'status overview refresh');
replaceOnce("function addActivity(text){const list=$('activity-list');const item=document.createElement('div');", "function addActivity(text){const list=$('activity-list'); const healthList=$('health-activity'); const item=document.createElement('div');", 'activity health hook');
replaceOnce("list.prepend(item);}", "list.prepend(item); if(healthList){ const clone=item.cloneNode(true); healthList.prepend(clone); } $('overview-last-activity').textContent=text;}", 'activity sync');
replaceOnce("document.querySelectorAll('[data-control]').forEach(b=>b.addEventListener('click',async()=>{const action=b.dataset.control;if(!state.activeSessionId){toast('Select or pair a session first.');return;}try{const r=await fetch(`/api/session/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:state.activeSessionId})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||`${action} unavailable`);toast(`${action} requested for ${state.activeSessionId}.`);}catch(e){toast(e.message);}}));", `document.querySelectorAll('[data-control]').forEach(b=>b.addEventListener('click',async()=>{const action=b.dataset.control;if(!state.activeSessionId){toast('Select or pair a session first.');return;}if(['disconnect','restart','stop'].includes(action)&&!window.confirm('Confirm this session action? The selected WhatsApp session may be interrupted.'))return;const original=b.textContent;b.disabled=true;b.textContent='Working…';try{const r=await fetch('/api/session/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:state.activeSessionId})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||action+' unavailable');toast(action.charAt(0).toUpperCase()+action.slice(1)+' requested for '+state.activeSessionId+'.');addActivity(action+' requested for '+state.activeSessionId);}catch(e){toast(e.message);}finally{b.disabled=false;b.textContent=original;}}));`, 'safe session controls');
const liveStatePatch = [
  "function syncOverview(){const s=state.activeSessionId?state.sessions.get(state.activeSessionId):null;const connected=Boolean(s?.connected);const status=s?.status||(connected?'Connected':'Waiting for a real backend session.');const stage=$('visual-stage');if(stage){const raw=status.toLowerCase();stage.dataset.connectionState=connected?'connected':raw.includes('error')?'error':raw.includes('expir')?'expired':raw.includes('connect')||raw.includes('pair')||raw.includes('prepar')?'connecting':'disconnected';$('scene-hud-label').textContent=connected?'LIVE SESSION · CONNECTED':status.toUpperCase().slice(0,42);}if($('overview-session-name'))$('overview-session-name').textContent=s?.phoneNumber||s?.sessionId||'No session selected';if($('overview-session-status'))$('overview-session-status').textContent=status;if($('overview-health-label'))$('overview-health-label').textContent=connected?'Session online':state.backend?'Backend ready':'Status unavailable';if($('overview-uptime'))$('overview-uptime').textContent=s?.connectedAt?formatUptime(s.connectedAt):connected?'Tracking':'—';if($('overview-backend'))$('overview-backend').textContent=state.backend?'HTTP 200':'Checking';if($('overview-mode'))$('overview-mode').textContent=s?.pairingCode?'Phone code':s?.qr?'QR session':'QR + phone code';if($('overview-md'))$('overview-md').textContent=s?.multiDevice===false?'Unavailable':'Enabled';if($('overview-signal-title'))$('overview-signal-title').textContent=connected?'Session connected and ready':'Ready for a secure link';if($('overview-health-dot'))$('overview-health-dot').style.background=connected?'var(--green)':'var(--amber)';updatePairStepper(s);}",
  "function formatUptime(value){const start=Number(value);if(!Number.isFinite(start))return 'Tracking';const seconds=Math.max(0,Math.floor((Date.now()-start)/1000));const h=Math.floor(seconds/3600);const m=Math.floor((seconds%3600)/60);return h?(h+'h '+m+'m'):(m+'m');}",
  "function updatePairStepper(s){const status=(s?.status||'').toLowerCase();const connected=Boolean(s?.connected);const stage=connected?4:(status.includes('pair')||s?.pairingCode||s?.qr?3:(status.includes('prepar')||status.includes('verif')?2:1));['select','verify','pairing','connected'].forEach((name,index)=>{const el=$('pair-step-'+name);if(el){el.classList.toggle('active',index+1===stage);el.classList.toggle('complete',index+1<stage);}});}",
  "function renderHealth(){if(!$('health-backend'))return;const s=state.activeSessionId?state.sessions.get(state.activeSessionId):null;$('health-backend').textContent=state.backend?'Healthy':'Unavailable';$('health-session').textContent=s?.connected?'Connected':(s?.status||'Waiting');}",
  "$('health-refresh')?.addEventListener('click',async()=>{const b=$('health-refresh');b.disabled=true;b.textContent='Refreshing…';await loadStatus();toast('Live status refreshed.');b.disabled=false;b.textContent='Refresh status';});",
  "function clearPairingView(){state.codeExpiresAt=0;state.qrExpiresAt=0;clearInterval(state.codeTimer);clearInterval(state.qrTimer);$('pairing-code-box').classList.remove('show');$('copy-code').disabled=true;$('qr-code').src='';$('qr-code').classList.add('hidden');$('qr-empty').classList.remove('hidden');$('qr-status').textContent='Waiting for QR';$('pairing-error').textContent='';toast('Temporary pairing view cleared. The backend session was not deleted.');}",
  "$('cancel-pairing')?.addEventListener('click',clearPairingView);$('cancel-qr')?.addEventListener('click',clearPairingView);",
  "let sceneScale=1,sceneRotation={x:0,y:0},sceneDrag=null;const phone=$('hero-phone');function applySceneTransform(){if(!phone)return;phone.style.transform='translateY('+(sceneDrag?.dy||0)+'px) rotateY('+sceneRotation.y+'deg) rotateX('+sceneRotation.x+'deg) rotateZ(5deg) scale('+sceneScale+')';}",
  "$('scene-zoom-in')?.addEventListener('click',()=>{sceneScale=Math.min(1.14,sceneScale+.06);applySceneTransform();});$('scene-zoom-out')?.addEventListener('click',()=>{sceneScale=Math.max(.82,sceneScale-.06);applySceneTransform();});$('scene-reset')?.addEventListener('click',()=>{sceneScale=1;sceneRotation={x:0,y:0};applySceneTransform();toast('3D view reset.');});phone?.addEventListener('pointerdown',e=>{sceneDrag={x:e.clientX,y:e.clientY,dx:0,dy:0};phone.setPointerCapture?.(e.pointerId);});phone?.addEventListener('pointermove',e=>{if(!sceneDrag)return;sceneRotation.y=Math.max(-18,Math.min(18,sceneRotation.y+(e.clientX-sceneDrag.x)*.18));sceneRotation.x=Math.max(-12,Math.min(12,sceneRotation.x-(e.clientY-sceneDrag.y)*.12));sceneDrag.x=e.clientX;sceneDrag.y=e.clientY;applySceneTransform();});phone?.addEventListener('pointerup',()=>{sceneDrag=null;});",
  "let lastHash='';function routeFromHash(){const r=location.hash.replace('#','')||'home';"
].join('\n');
replaceOnce("let lastHash='';function routeFromHash(){const r=location.hash.replace('#','')||'home';", liveStatePatch, 'extended live state and controls');
replaceOnce("renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));", "renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));", '3D pixel ratio');
replaceOnce("positions=new Float32Array(240*3); for(let i=0;i<240;i++)", "positions=new Float32Array(96*3); for(let i=0;i<96;i++)", '3D particle budget');

// Remove informal decorative labels from the new-facing controls without touching legacy bot responses.
html = html.replace('📱 Phone number', 'Phone number').replace('📷 QR code', 'QR code').replace('🌿 WhatsApp Green', 'WhatsApp Green').replace('🌌 Midnight Dark', 'Midnight Dark').replace('💜 Neon Purple', 'Neon Purple').replace('🔵 Cyber Blue', 'Cyber Blue').replace('🌅 Sunset', 'Sunset').replace('🌸 Pink Neon', 'Pink Neon').replace('🤍 Clean Light', 'Clean Light').replace('🌈 Aurora', 'Aurora').replace('🖤 AMOLED Black', 'AMOLED Black').replace('⚡ Cyberpunk', 'Cyberpunk').replace(/WHATSAPP BOT PLATFORM/g, 'WHATSAPP BOT COMMAND CENTER').replace(/POWERED BY ☠︎︎ 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☠︎︎/g, 'POWERED BY 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳');

fs.writeFileSync(file, html);
console.log(`Updated ${file}`);
