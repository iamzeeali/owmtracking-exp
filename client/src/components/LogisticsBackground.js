import React from 'react';

// ── Static data ──────────────────────────────────────────────────────────────

const PULSE_NODES = [
  { x: '8%', y: '22%', delay: 0 },
  { x: '24%', y: '14%', delay: 1.8 },
  { x: '41%', y: '24%', delay: 3.4 },
  { x: '56%', y: '9%', delay: 0.9 },
  { x: '70%', y: '17%', delay: 2.5 },
  { x: '84%', y: '26%', delay: 1.3 },
  { x: '31%', y: '40%', delay: 2.1 },
  { x: '62%', y: '35%', delay: 0.5 },
];

// Each trail: distance from top, animation duration, starting delay offset, width in px
const TRAILS = [
  { top: '21%', dur: 34, delay: 0, w: 200 },
  { top: '37%', dur: 27, delay: 9, w: 130 },
  { top: '54%', dur: 41, delay: 18, w: 240 },
  { top: '67%', dur: 24, delay: 5, w: 100 },
  { top: '79%', dur: 38, delay: 23, w: 170 },
];

// Blinking shipment indicator positions (evenly scattered, avoiding centre)
const BLINKS = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 10.3 + 5) % 90}%`,
  top: `${(i * 13.7 + 8) % 65}%`,
  del: `${i * 0.6}s`,
  dur: `${2 + (i % 4) * 0.8}s`,
}));

// Route network: nodes + bezier paths connecting them
const NODES = [
  [120, 180], [340, 120], [580, 200],
  [780, 140], [1000, 220], [1240, 160],
  [440, 310], [860, 300],
];
const ROUTES = [
  { d: 'M120,180 C200,120 280,140 340,120', dur: 18, del: '0s' },
  { d: 'M340,120 C420,90 520,180 580,200', dur: 22, del: '-4s' },
  { d: 'M580,200 C660,220 720,150 780,140', dur: 19, del: '-9s' },
  { d: 'M780,140 C870,130 940,230 1000,220', dur: 24, del: '-2s' },
  { d: 'M1000,220 C1090,200 1170,180 1240,160', dur: 20, del: '-7s' },
  { d: 'M340,120 C360,200 400,270 440,310', dur: 17, del: '-12s' },
  { d: 'M440,310 C580,340 720,320 860,300', dur: 26, del: '-5s' },
  { d: 'M580,200 C560,250 510,290 440,310', dur: 21, del: '-15s' },
];

// ── Industrial skyline (viewBox 0 0 1440 500) ────────────────────────────────
// Left→right narrative: steel plant & stacks → container yard → 3PL cross-dock
// warehouse → port gantry crane → intermodal terminal → freight sheds → yard
const SKYLINE =
  /* Ground + steel-plant mass */
  'M0,500 L0,398 L38,398 L38,368 L52,368 L52,328 L64,328 L64,368 L78,368 L78,392 ' +
  'L92,392 L92,352 L102,352 L102,288 L108,288 L108,248 L114,248 L114,288 L122,288 ' +
  'L122,338 L132,338 L132,378 L148,378 L148,402 L168,402 L168,372 L182,372 L182,338 ' +
  /* Container yard plateau */
  'L198,338 L198,318 L212,318 L212,338 L226,338 L226,308 L238,308 L238,338 L252,338 ' +
  'L252,318 L266,318 L266,338 L280,338 L280,308 L292,308 L292,338 L306,338 L306,318 ' +
  'L320,318 L320,338 L334,338 L334,308 L346,308 L346,338 L360,338 L360,318 L374,318 ' +
  'L374,338 L388,338 L388,365 L402,365 L402,398 ' +
  /* Mega 3PL warehouse + crane pad */
  'L418,398 L418,268 L438,258 L548,258 L568,268 L568,398 L582,398 L582,372 ' +
  'L596,372 L596,188 L604,182 L608,182 L608,52 L618,52 L618,182 L624,182 L624,188 ' +
  'L632,188 L632,372 L648,372 L648,402 ' +
  /* Intermodal / transload hall */
  'L668,402 L668,288 L688,278 L928,278 L948,288 L948,402 L968,402 L968,382 ' +
  /* Freight terminal sheds (sawtooth roof) */
  'L988,382 L988,348 L1002,322 L1016,348 L1030,322 L1044,348 L1058,322 L1072,348 ' +
  'L1086,322 L1100,348 L1114,322 L1128,348 L1142,322 L1156,348 L1170,322 L1184,348 ' +
  'L1198,382 L1198,402 ' +
  /* Silos + container marshalling */
  'L1212,402 L1212,348 L1228,328 L1244,348 L1244,392 L1268,392 L1268,352 L1288,352 ' +
  'L1288,392 L1308,392 L1308,368 L1328,368 L1328,392 L1348,392 L1348,408 ' +
  'L1388,408 L1388,418 L1440,418 L1440,500 Z';

/** Container yard: ISO box stacks (3PL / intermodal yard) */
const YARD_CONTAINERS = Array.from({ length: 40 }, (_, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  return { x: 192 + col * 22, y: 352 - row * 8, w: 20, h: 7 };
});

const LOADING_BAYS = Array.from({ length: 15 }, (_, i) => 436 + i * 8);

/** Distant articulated trucks (horizon line — supply chain corridor) */
const DISTANT_TRUCKS = [
  { y: 332, scale: 1, delay: '0s', dur: 52 },
  { y: 338, scale: 0.85, delay: '-18s', dur: 64 },
  { y: 328, scale: 0.7, delay: '-35s', dur: 71 },
];

const SMOKE_PUFFS = [
  { cx: 105, cy: 232, rx: 14, ry: 7, delay: '0s' },
  { cx: 132, cy: 218, rx: 18, ry: 9, delay: '-7s' },
  { cx: 88, cy: 240, rx: 11, ry: 6, delay: '-12s' },
];

// ── Component ────────────────────────────────────────────────────────────────

const LogisticsBackground = () => (
  <div className="lb-root" aria-hidden="true">
    {/* ── Layer 1: Atmospheric depth gradients ── */}
    <div className="lb-atmo" />

    {/* ── Layer 2: Industrial skyline silhouette ── */}
    <svg
      className="lb-sil"
      viewBox="0 0 1440 500"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Main mass: steel → yard → warehouses → terminal → marshalling */}
      <path d={SKYLINE} className="lb-skyline-path" />

      {/* Steel plant: blast furnace glow + stack rims */}
      <ellipse cx="118" cy="385" rx="22" ry="10" className="lb-furnace-glow" />
      <line x1="104" y1="248" x2="104" y2="288" className="lb-stack-rim" strokeWidth="2" />
      <line x1="108" y1="248" x2="108" y2="288" className="lb-stack-rim" strokeWidth="1" />
      <line x1="132" y1="338" x2="132" y2="378" className="lb-stack-rim" strokeWidth="1.5" />

      {/* Steel mill smoke / steam (ambient) */}
      {SMOKE_PUFFS.map((s, i) => (
        <ellipse
          key={`smoke-${i}`}
          cx={s.cx}
          cy={s.cy}
          rx={s.rx}
          ry={s.ry}
          className="lb-smoke"
          style={{ animationDelay: s.delay }}
        />
      ))}

      {/* Container yard: stacked boxes */}
      {/* <g className="lb-container-yard">
        {YARD_CONTAINERS.map((c, i) => (
          <rect
            key={`ct-${i}`}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx="0.5"
            className="lb-container-box"
          />
        ))}
      </g> */}

      {/* 3PL cross-dock: loading bay doors */}
      {/* <g className="lb-loading-bays">
        {LOADING_BAYS.map((x) => (
          <line
            key={`bay-${x}`}
            x1={x}
            y1="398"
            x2={x}
            y2="368"
            className="lb-bay-door"
            strokeWidth="1.2"
          />
        ))}
      </g> */}

      {/* Intermodal hall: shallow dock level lines */}
      <line x1="688" y1="392" x2="928" y2="392" className="lb-terminal-dock" strokeWidth="1" />

      {/* Port / freight terminal: ship-to-shore gantry */}
      {/* <g className="lb-sts-gantry">
        <line x1="1248" y1="402" x2="1248" y2="268" className="lb-gantry-leg" strokeWidth="2.5" />
        <line x1="1338" y1="402" x2="1338" y2="268" className="lb-gantry-leg" strokeWidth="2.5" />
        <line x1="1225" y1="262" x2="1362" y2="262" className="lb-gantry-beam" strokeWidth="4" />
        <g className="lb-gantry-trolley">
          <line x1="1288" y1="262" x2="1288" y2="318" className="lb-gantry-cable" strokeWidth="1" />
          <rect x="1270" y="318" width="36" height="22" rx="1" className="lb-spreader-box" />
        </g>
      </g> */}

      {/* Tower crane over distribution centre (jib aligned to new mast) */}
      {/* <line x1="428" y1="54" x2="698" y2="54" className="lb-crane-el" strokeWidth="4.5" />
      <line x1="613" y1="54" x2="613" y2="182" className="lb-crane-el" strokeWidth="2.5" />
      <line x1="613" y1="54" x2="405" y2="188" className="lb-crane-wire" />
      <line x1="628" y1="54" x2="652" y2="195" className="lb-crane-wire" /> */}

      {/* Slow-moving hoist + container */}
      {/* <g className="lb-crane-anim">
        <line x1="0" y1="0" x2="0" y2="52" className="lb-crane-el" strokeWidth="1.5" />
        <rect x="-27" y="52" width="54" height="30" rx="2" className="lb-crane-box" />
      </g> */}

      {/* Distant trucks on logistics spine (read as moving freight) */}
      {/* <g className="lb-distant-trucks">
        {DISTANT_TRUCKS.map((t, i) => (
          <g key={`tr-${i}`} transform={`translate(0,${t.y})`}>
            <g
              className={`lb-truck-drift lb-truck-drift-${i}`}
              style={{
                animationDuration: `${t.dur}s`,
                animationDelay: t.delay,
              }}
            >
              <g transform={`scale(${t.scale})`}>
                <path
                  d="M-4,14 L52,14 L52,10 L68,10 L74,14 L78,14 L78,22 L-4,22 Z"
                  className="lb-truck-sil"
                />
                <rect x="54" y="12" width="10" height="10" rx="1" className="lb-truck-cab" />
              </g>
            </g>
          </g>
        ))}
      </g> */}
    </svg>

    {/* ── Layer 3: Logistics route network ── */}
    <div className="lb-net-wrap">
      <svg
        className="lb-net"
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Animated route paths */}
        {ROUTES.map((r, i) => (
          <path
            key={i}
            d={r.d}
            className="lb-route"
            style={{ animationDuration: `${r.dur}s`, animationDelay: r.del }}
          />
        ))}

        {/* Network nodes */}
        {NODES.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r="3.5"
            className="lb-node"
            style={{ animationDelay: `${i * 0.55}s` }}
          />
        ))}
      </svg>
    </div>

    {/* ── Layer 4: Truck light trails ── */}
    <div className="lb-trails-layer">
      {TRAILS.map((t, i) => (
        <div
          key={i}
          className="lb-trail"
          style={{
            top: t.top,
            width: `${t.w}px`,
            animationDuration: `${t.dur}s`,
            animationDelay: `${-t.delay}s`,
          }}
        />
      ))}
    </div>

    {/* ── Layer 5: Live tracking pulse nodes ── */}
    <div className="lb-pulses-layer">
      {PULSE_NODES.map((p, i) => (
        <div
          key={i}
          className="lb-pulse-wrap"
          style={{ left: p.x, top: p.y }}
        >
          <div className="lb-pulse-ring" style={{ animationDelay: `${p.delay}s` }} />
          <div className="lb-pulse-ring lb-pr2" style={{ animationDelay: `${p.delay + 0.9}s` }} />
          <div className="lb-pulse-dot" />
        </div>
      ))}
    </div>

    {/* ── Layer 6: Radar / scanning sweep ── */}
    {/* <div className="lb-radar-layer">
      <svg viewBox="0 0 200 200" className="lb-radar-svg">
        <circle cx="100" cy="100" r="38" className="lb-rc" />
        <circle cx="100" cy="100" r="65" className="lb-rc" />
        <circle cx="100" cy="100" r="93" className="lb-rc" />
        <line x1="100" y1="7" x2="100" y2="193" className="lb-raxis" />
        <line x1="7" y1="100" x2="193" y2="100" className="lb-raxis" /> */}
    {/* Rotating sweep arm + sector */}
    {/* <g className="lb-radar-spin" style={{ transformOrigin: '100px 100px' }}>
          <path d="M100,100 L100,7 A93,93 0 0,1 193,100 Z" className="lb-rsector" />
          <line x1="100" y1="100" x2="100" y2="7" className="lb-rarm" />
        </g> */}
    {/* </svg> */}
    {/* </div> */}

    {/* ── Layer 7: Blinking shipment indicators ── */}
    <div className="lb-blinks-layer">
      {BLINKS.map((b, i) => (
        <div
          key={i}
          className="lb-blink"
          style={{ left: b.left, top: b.top, animationDelay: b.del, animationDuration: b.dur }}
        />
      ))}
    </div>

    {/* ── Layer 8: Horizontal grid overlay ── */}
    <svg className="lb-grid" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i}
          x1="0" y1={i * 75} x2="1440" y2={i * 75}
          className="lb-grid-line"
          style={{ animationDelay: `${i * 0.8}s` }}
        />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i}
          x1={i * 76} y1="0" x2={i * 76} y2="900"
          className="lb-grid-line lb-grid-vert"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>

    {/* ── Layer 9: Industrial orange glow accents ── */}
    <div className="lb-glow-bl" />
    <div className="lb-glow-tr" />

    {/* ── Layer 10: Readability vignette ── */}
    <div className="lb-vignette" />
  </div>
);

export default LogisticsBackground;
