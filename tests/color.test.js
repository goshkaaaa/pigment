import test from "node:test";
import assert from "node:assert/strict";
import {
  contrast,
  cssVariables,
  generatePalette,
  hslToHex,
  isHex,
  luminance,
  parsePalette,
  startingPalette,
  textColor,
} from "../src/color.js";

test("WCAG black and white contrast is 21:1", () => {
  assert.equal(contrast("#000000", "#FFFFFF"), 21);
  assert.equal(contrast("#FFFFFF", "#000000"), 21);
  assert.equal(contrast("#123456", "#123456"), 1);
});
test("relative luminance has expected endpoints", () => {
  assert.equal(luminance("#000000"), 0);
  assert.equal(luminance("#FFFFFF"), 1);
});
test("HSL conversion matches primary colors", () => {
  assert.equal(hslToHex(0, 100, 50), "#FF0000");
  assert.equal(hslToHex(120, 100, 50), "#00FF00");
  assert.equal(hslToHex(240, 100, 50), "#0000FF");
});
test("generating preserves locked colors", () => {
  const locks = [true, false, true, false, false];
  const next = generatePalette(startingPalette, locks, () => 0.5);
  assert.equal(next[0], startingPalette[0]);
  assert.equal(next[2], startingPalette[2]);
  assert.notEqual(next[1], startingPalette[1]);
  assert.ok(next.every(isHex));
});
test("palette links round-trip and reject invalid data", () => {
  assert.deepEqual(
    parsePalette(
      `#${startingPalette.map((color) => color.slice(1)).join("-")}`,
    ),
    startingPalette,
  );
  assert.equal(parsePalette("#ffffff-000000"), null);
  assert.equal(parsePalette("#zzzzzz-ffffff-ffffff-ffffff-ffffff"), null);
});
test("text color chooses the stronger contrast", () => {
  assert.equal(textColor("#000000"), "#FFFFFF");
  assert.equal(textColor("#FFFFFF"), "#242629");
});
test("CSS export produces five usable variables", () => {
  assert.equal(
    (cssVariables(startingPalette).match(/--color-/g) || []).length,
    5,
  );
});
