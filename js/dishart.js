const TONES = {
  strawberry: ['#f4a09a', '#d4544f'],
  apple: ['#f0a98d', '#c65c46'],
  guava: ['#e2ecbc', '#c0cf86'],
  lemon: ['#fbe9a0', '#dfbe4d'],
  blueberry: ['#aab8dd', '#5a6b9e']
};

const fmt = (n) => Number(n.toFixed(1));

function fruitGlyph(id, x, y, r, key) {
  const [light, deep] = TONES[id] || TONES.strawberry;
  return `
  <g>
    <circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(r)}" fill="url(#fr${key})" stroke="rgba(74,68,60,.55)" stroke-width="1.8"/>
    <circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(r)}" fill="url(#fr${key})"/>
    <path d="M${fmt(x)} ${fmt(y - r)}c-${fmt(r * 0.4)}-${fmt(r * 0.3)}-${fmt(r * 0.6)} ${fmt(r * 0.1)}-${fmt(r * 0.3)} ${fmt(r * 0.3)}" stroke="rgba(74,68,60,.45)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <defs>
      <radialGradient id="fr${key}" cx="0.34" cy="0.3" r="0.78">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="1" stop-color="${deep}"/>
      </radialGradient>
    </defs>
  </g>`;
}

function glass(liquid, toneLight, toneDeep) {
  return `
  <ellipse cx="180" cy="244" rx="66" ry="12" fill="rgba(91,74,54,.14)"/>
  <path d="M120 66 L131 212 Q133 226 148 226 H212 Q227 226 229 212 L240 66 Z"
        fill="rgba(255,253,247,.55)" stroke="rgba(91,86,76,.45)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="${liquid}" fill="url(#liquid)" opacity="0.92"/>
  <ellipse cx="180" cy="66" rx="60" ry="12.5" fill="rgba(255,255,252,.6)" stroke="rgba(91,86,76,.45)" stroke-width="2.4"/>
  <path d="M136 86 L144 198" stroke="rgba(255,255,255,.75)" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  <path d="M224 92 L218 190" stroke="rgba(91,86,76,.12)" stroke-width="6" stroke-linecap="round"/>`;
}

function iceGlass(liquid) {
  return `
  <ellipse cx="180" cy="244" rx="66" ry="12" fill="rgba(91,74,54,.14)"/>
  <path d="M120 66 L131 212 Q133 226 148 226 H212 Q227 226 229 212 L240 66 Z"
        fill="rgba(255,253,247,.55)" stroke="rgba(91,86,76,.45)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="${liquid}" fill="url(#liquid)" opacity="0.82"/>
  <g fill="rgba(255,255,255,.62)" stroke="rgba(91,86,76,.22)" stroke-width="1.4">
    <rect x="150" y="112" width="26" height="26" rx="5" transform="rotate(-12 163 125)"/>
    <rect x="186" y="138" width="22" height="22" rx="4" transform="rotate(16 197 149)"/>
    <rect x="158" y="164" width="20" height="20" rx="4" transform="rotate(-6 168 174)"/>
  </g>
  <ellipse cx="180" cy="66" rx="60" ry="12.5" fill="rgba(255,255,252,.6)" stroke="rgba(91,86,76,.45)" stroke-width="2.4"/>
  <path d="M222 46 L246 118" stroke="rgba(232,163,169,.75)" stroke-width="6" stroke-linecap="round"/>`;
}

function cup(liquid) {
  return `
  <ellipse cx="180" cy="240" rx="56" ry="10" fill="rgba(91,74,54,.14)"/>
  <path d="M112 92 Q180 196 248 92 Z" fill="rgba(255,253,247,.72)" stroke="rgba(91,86,76,.45)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="${liquid}" fill="url(#liquid)" opacity="0.9"/>
  <ellipse cx="180" cy="92" rx="68" ry="15" fill="rgba(255,255,252,.72)" stroke="rgba(91,86,76,.45)" stroke-width="2.4"/>
  <path d="M172 196 L168 226 H192 L188 196 Z" fill="rgba(255,253,247,.72)" stroke="rgba(91,86,76,.4)" stroke-width="2.2"/>
  <ellipse cx="180" cy="230" rx="30" ry="8" fill="rgba(255,253,247,.8)" stroke="rgba(91,86,76,.4)" stroke-width="2.2"/>`;
}

function ramekin(liquid) {
  return `
  <ellipse cx="180" cy="232" rx="86" ry="14" fill="rgba(91,74,54,.14)"/>
  <path d="M104 142 Q104 220 180 220 Q256 220 256 142 Z"
        fill="rgba(255,252,244,.9)" stroke="rgba(91,86,76,.45)" stroke-width="2.6" stroke-linejoin="round"/>
  <ellipse cx="180" cy="142" rx="76" ry="24" fill="url(#liquid)" opacity="0.9"/>
  <ellipse cx="180" cy="142" rx="76" ry="24" fill="none" stroke="rgba(91,86,76,.45)" stroke-width="2.6"/>
  <path d="M112 138c14-12 32-18 50-18M202 122c16 2 30 8 40 16" stroke="rgba(255,255,255,.6)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g fill="rgba(214,168,110,.55)">
    <circle cx="140" cy="146" r="5"/><circle cx="164" cy="132" r="4"/>
    <circle cx="196" cy="150" r="4.5"/><circle cx="220" cy="136" r="4"/>
  </g>`;
}

function flask(liquid) {
  return `
  <ellipse cx="180" cy="242" rx="60" ry="11" fill="rgba(91,74,54,.14)"/>
  <path d="M168 62 h24 v34 l38 104 q4 16-14 16 h-72 q-18 0-14-16 l38-104 Z"
        fill="rgba(255,253,247,.5)" stroke="rgba(91,86,76,.45)" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="${liquid}" fill="url(#liquid)" opacity="0.8"/>
  <ellipse cx="180" cy="62" rx="13" ry="5" fill="rgba(255,255,252,.8)" stroke="rgba(91,86,76,.45)" stroke-width="2.2"/>
  <circle cx="150" cy="176" r="4" fill="rgba(255,255,255,.7)"/>
  <circle cx="206" cy="196" r="3" fill="rgba(255,255,255,.6)"/>
  <circle cx="188" cy="160" r="2.5" fill="rgba(255,255,255,.7)"/>`;
}

function steam() {
  return `
  <g stroke="rgba(255,255,255,.85)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.75">
    <path d="M150 44c-8-12 6-20 0-32"/>
    <path d="M180 38c-8-12 6-22 0-32"/>
    <path d="M210 46c-8-12 6-20 0-32"/>
  </g>`;
}

export function dishArt(dish, ids) {
  const tones = ids.map((id) => TONES[id] || TONES.strawberry);
  const main = tones[0];
  const hot = ['烘焙', '饮品'].includes(dish.type);
  const type = dish.type;

  let body = '';
  let baseY = 112;
  if (type === '冰品') {
    body = iceGlass('M124 112 L131 212 Q133 226 148 226 H212 Q227 226 229 212 L236 112 Z');
    baseY = 122;
  } else if (type === '甜品') {
    body = cup('M118 94 Q180 186 242 94 Z');
    baseY = 84;
  } else if (type === '烘焙') {
    body = ramekin('');
    baseY = 134;
  } else if (type === '黑暗料理' || type === '创意') {
    body = flask('M150 128 L124 200 Q120 214 136 214 H224 Q240 214 236 200 L210 128 Z');
    baseY = 150;
  } else {
    body = glass('M124 100 L131 212 Q133 226 148 226 H212 Q227 226 229 212 L236 100 Z');
    baseY = 106;
  }

  const positions = [
    [148, baseY, 18],
    [182, baseY - 14, 15],
    [212, baseY + 8, 17]
  ];

  const fruits = ids
    .slice(0, 3)
    .map((id, i) => {
      const [x, y, r] = positions[i];
      return fruitGlyph(id, x, y, r, String(i));
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="34 26 292 218" width="360" height="270">
  <defs>
    <linearGradient id="liquid" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${main[0]}"/>
      <stop offset="1" stop-color="${main[1]}"/>
    </linearGradient>
  </defs>
  ${hot ? steam() : ''}
  ${body}
  ${fruits}
  <path d="M236 86c10-10 18-12 24-10-4 10-12 14-24 10Z" fill="rgba(147,169,141,.85)" stroke="rgba(74,68,60,.4)" stroke-width="1.8" stroke-linejoin="round"/>
</svg>`;
}

export function dishArtUri(dish, ids) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dishArt(dish, ids))}`;
}
