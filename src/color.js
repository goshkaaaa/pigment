export const startingPalette = [
  "#E9E7DC",
  "#D2D8BA",
  "#FF6B4A",
  "#4B5DFF",
  "#242629",
];
export function isHex(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
export function luminance(hex) {
  const values = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
export function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
export function textColor(hex) {
  return contrast(hex, "#242629") >= contrast(hex, "#FFFFFF")
    ? "#242629"
    : "#FFFFFF";
}
export function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}
export function generatePalette(current, locked, random = Math.random) {
  const hue = random() * 360;
  const offsets = [0, 30, 160, 210, 0];
  const lightness = [91, 76, 60, 51, 16];
  return current.map((color, index) =>
    locked[index]
      ? color
      : hslToHex(
          (hue + offsets[index]) % 360,
          index === 0 || index === 4 ? 15 : 45 + random() * 40,
          lightness[index],
        ),
  );
}
export function cssVariables(colors) {
  return `:root {\n${colors.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n")}\n}\n`;
}
export function parsePalette(hash) {
  const values = hash
    .replace(/^#/, "")
    .split("-")
    .map((value) => `#${value.toUpperCase()}`);
  return values.length === 5 && values.every(isHex) ? values : null;
}
