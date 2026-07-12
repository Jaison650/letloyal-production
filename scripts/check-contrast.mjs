// WCAG 2.1 contrast checker for Teal & Honey token pairs.
// Solid-on-solid pairs only (rgba subtle backgrounds are checked visually on /design-system).

const light = {
  page: '#F4F6F2', s1: '#FFFFFF', s2: '#ECF0EA',
  textP: '#17201D', textS: '#5C6B64', textT: '#85958D',
  accent: '#0B7C6C', accentFg: '#FFFFFF',
  reward: '#F2B824', rewardDeep: '#8A6410', rewardSubtle: '#FBF0CE', rewardFg: '#231A04',
  good: '#1E7A4C', warn: '#96590E', bad: '#B3382E', info: '#2E6BD6',
};
const dark = {
  page: '#0F1513', s1: '#161E1B', s2: '#1C2622',
  textP: '#EDF2EE', textS: '#9BABA2', textT: '#647169',
  accent: '#2CBFA9', accentFg: '#06231D',
  reward: '#F2C230', rewardDeep: '#F5D269', rewardFg: '#231A04',
  good: '#4ADE94', warn: '#F0B25A', bad: '#F0716C', info: '#7AA7F0',
};

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    let v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [name, fg, bg, minimum]  — 4.5 body text, 3.0 large text / UI components
const checks = [
  ['light text-primary on page', light.textP, light.page, 4.5],
  ['light text-primary on surface-1', light.textP, light.s1, 4.5],
  ['light text-secondary on surface-1', light.textS, light.s1, 4.5],
  ['light text-tertiary on surface-1 (large/labels)', light.textT, light.s1, 3.0],
  ['light accent-fg on accent (buttons)', light.accentFg, light.accent, 4.5],
  ['light accent on surface-1 (links)', light.accent, light.s1, 4.5],
  ['light reward-fg on reward (buttons)', light.rewardFg, light.reward, 4.5],
  ['light reward-deep on reward-subtle (badges)', light.rewardDeep, light.rewardSubtle, 4.5],
  ['light good on surface-1', light.good, light.s1, 4.5],
  ['light warn on surface-1', light.warn, light.s1, 4.5],
  ['light bad on surface-1', light.bad, light.s1, 4.5],
  ['light info on surface-1', light.info, light.s1, 4.5],
  ['light text-secondary on surface-2', light.textS, light.s2, 4.5],

  ['dark text-primary on page', dark.textP, dark.page, 4.5],
  ['dark text-primary on surface-1', dark.textP, dark.s1, 4.5],
  ['dark text-secondary on surface-1', dark.textS, dark.s1, 4.5],
  ['dark text-tertiary on surface-1 (large/labels)', dark.textT, dark.s1, 3.0],
  ['dark accent-fg on accent (buttons)', dark.accentFg, dark.accent, 4.5],
  ['dark accent on surface-1 (links)', dark.accent, dark.s1, 4.5],
  ['dark reward-fg on reward (buttons)', dark.rewardFg, dark.reward, 4.5],
  ['dark good on surface-1', dark.good, dark.s1, 4.5],
  ['dark warn on surface-1', dark.warn, dark.s1, 4.5],
  ['dark bad on surface-1', dark.bad, dark.s1, 4.5],
  ['dark info on surface-1', dark.info, dark.s1, 4.5],
  ['dark text-secondary on surface-2', dark.textS, dark.s2, 4.5],
];

let failed = 0;
for (const [name, fg, bg, min] of checks) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (min ${min})  ${name}`);
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
