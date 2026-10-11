// Contrast Checker for YamkSpeed Design Tokens (WCAG 2.1 AA verification)

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const tokens = {
  dark: {
    bg: '#070B14',
    surface: '#0E1626',
    surface2: '#16213A',
    text: '#E8EEF9',
    textMuted: '#93A1BD',
    accentDown: '#22E6C3',
    accentUp: '#8B6CFF',
    accentLat: '#FFB547',
    danger: '#FF6B7A'
  },
  light: {
    bg: '#F6F3EC',
    surface: '#FFFFFF',
    surface2: '#EEE9DD',
    text: '#0B1220',
    textMuted: '#4B5568',
    accentDown: '#0A8F7A',
    accentUp: '#5B3FE0',
    accentLat: '#B86E00',
    danger: '#C62839'
  }
};

let allPass = true;

console.log("=== Checking WCAG AA Contrast Ratios ===\n");

for (const theme of ['dark', 'light']) {
  console.log(`--- Theme: ${theme.toUpperCase()} ---`);
  const t = tokens[theme];
  const bgRgb = hexToRgb(t.bg);
  const surfaceRgb = hexToRgb(t.surface);

  const checks = [
    { name: 'text on bg', fg: t.text, bg: bgRgb, target: 4.5 },
    { name: 'text on surface', fg: t.text, bg: surfaceRgb, target: 4.5 },
    { name: 'text-muted on bg', fg: t.textMuted, bg: bgRgb, target: 4.5 },
    { name: 'text-muted on surface', fg: t.textMuted, bg: surfaceRgb, target: 4.5 },
    { name: 'accent-down (large UI/gauge)', fg: t.accentDown, bg: bgRgb, target: 3.0 },
    { name: 'accent-up (large UI/gauge)', fg: t.accentUp, bg: bgRgb, target: 3.0 },
    { name: 'danger on bg', fg: t.danger, bg: bgRgb, target: 4.0 }
  ];

  for (const check of checks) {
    const fgRgb = hexToRgb(check.fg);
    const ratio = contrastRatio(fgRgb, check.bg);
    const pass = ratio >= check.target;
    if (!pass) allPass = false;
    const status = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} [${ratio.toFixed(2)}:1 >= ${check.target}:1] ${check.name} (${check.fg})`);
  }
  console.log("");
}

if (!allPass) {
  console.error("❌ Some contrast checks failed!");
  process.exit(1);
} else {
  console.log("🎉 All WCAG contrast checks passed successfully!");
}
