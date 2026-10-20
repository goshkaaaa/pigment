<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  contrast,
  cssVariables,
  generatePalette,
  isHex,
  parsePalette,
  startingPalette,
  textColor,
} from "./color";

const colors = ref([...startingPalette]);
const locked = ref([false, false, false, false, false]);
const saved = ref([]);
const history = ref([]);
const foreground = ref(4);
const background = ref(0);
const message = ref("");
const tab = ref("playground");
const paletteName = ref("");
const ratio = computed(() =>
  contrast(colors.value[foreground.value], colors.value[background.value]),
);
const previewStyle = computed(() => ({
  background: colors.value[background.value],
  color: colors.value[foreground.value],
  "--accent": colors.value[2],
}));

function remember() {
  history.value = [...history.value.slice(-19), [...colors.value]];
}
function generate() {
  if (locked.value.every(Boolean)) {
    message.value = "Unlock a color to try something new.";
    return;
  }
  remember();
  colors.value = generatePalette(colors.value, locked.value);
  syncHash();
  message.value = "A fresh color story. Keep what feels right.";
}
function undo() {
  if (!history.value.length) return;
  colors.value = history.value.pop();
  syncHash();
}
function syncHash() {
  window.history.replaceState(
    null,
    "",
    `#${colors.value.map((color) => color.slice(1)).join("-")}`,
  );
}
function editColor(index, value) {
  if (!isHex(value)) return;
  remember();
  colors.value[index] = value.toUpperCase();
  syncHash();
}
async function copy(value, success) {
  try {
    await navigator.clipboard.writeText(value);
    message.value = success;
  } catch {
    message.value =
      "Clipboard unavailable. Use Export CSS to download your colors.";
  }
}
function share() {
  copy(window.location.href, "Palette link copied.");
}
function exportCss() {
  const url = URL.createObjectURL(
    new Blob([cssVariables(colors.value)], { type: "text/css" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "pigment.css";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message.value = "CSS exported. Go make something good.";
}
function persist(next) {
  saved.value = next;
  try {
    localStorage.setItem("pigment:library:v1", JSON.stringify(next));
  } catch {
    message.value =
      "Could not save on this device. Export CSS to keep your palette.";
    return false;
  }
  return true;
}
function save() {
  if (saved.value.length >= 40) {
    message.value =
      "Your shelf is full. Remove a palette before saving another.";
    return;
  }
  const name =
    paletteName.value.trim() || `Color story ${saved.value.length + 1}`;
  if (
    persist([
      ...saved.value,
      { id: crypto.randomUUID(), name, colors: [...colors.value] },
    ])
  )
    message.value = `“${name}” is on your shelf.`;
  paletteName.value = "";
}
function loadPalette(palette) {
  remember();
  colors.value = [...palette.colors];
  locked.value = [false, false, false, false, false];
  tab.value = "playground";
  syncHash();
  message.value = `Loaded “${palette.name}”.`;
}
function handleKey(event) {
  if (
    event.code !== "Space" ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.closest("input,select,button,a,textarea,[contenteditable]") ||
    tab.value !== "playground"
  )
    return;
  event.preventDefault();
  generate();
}
function readHash() {
  const parsed = parsePalette(window.location.hash);
  if (parsed) colors.value = parsed;
}
onMounted(() => {
  readHash();
  try {
    const data = JSON.parse(localStorage.getItem("pigment:library:v1") || "[]");
    if (Array.isArray(data))
      saved.value = data
        .filter(
          (item) =>
            typeof item?.id === "string" &&
            typeof item.name === "string" &&
            item.name.length <= 60 &&
            Array.isArray(item.colors) &&
            item.colors.length === 5 &&
            item.colors.every(isHex),
        )
        .slice(0, 40);
  } catch {
    message.value =
      "Saved palettes could not be read. Your playground still works.";
  }
  window.addEventListener("keydown", handleKey);
  window.addEventListener("hashchange", readHash);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKey);
  window.removeEventListener("hashchange", readHash);
});
</script>

<template>
  <header class="masthead">
    <a class="wordmark" href="#" @click.prevent="tab = 'playground'"
      >pigment<span>®</span></a
    ><span class="edition"
      >AN INDEPENDENT COLOR PLAYGROUND<br />ISSUE 001 — ENDLESS
      POSSIBILITIES</span
    >
    <nav aria-label="Main">
      <button :aria-pressed="tab === 'playground'" @click="tab = 'playground'">
        Playground</button
      ><button :aria-pressed="tab === 'library'" @click="tab = 'library'">
        Your shelf <span class="count">{{ saved.length }}</span>
      </button>
    </nav>
  </header>
  <main>
    <template v-if="tab === 'playground'">
      <section class="intro">
        <div>
          <p class="eyebrow">GOOD THINGS START WITH A COLOR.</p>
          <h1>Trust your <em>hue.</em><span class="asterisk">✳</span></h1>
        </div>
        <div class="intro-note">
          <p>
            A tiny tool for your next big idea.<br />Mix, match, and find a
            little unexpected.
          </p>
          <button class="generate" @click="generate">
            Shuffle the palette <span>↗</span></button
          ><small>or press <kbd>space</kbd> to see what happens</small>
        </div>
      </section>
      <section class="palette" aria-label="Palette editor">
        <article
          v-for="(color, index) in colors"
          :key="index"
          class="swatch"
          :style="{ background: color, color: textColor(color) }"
        >
          <div class="swatch-top">
            <span>0{{ index + 1 }}</span
            ><button
              class="lock"
              :aria-label="`${locked[index] ? 'Unlock' : 'Lock'} color ${index + 1}`"
              :aria-pressed="locked[index]"
              @click="locked[index] = !locked[index]"
            >
              {{ locked[index] ? "LOCKED ▣" : "LOCK ◇" }}
            </button>
          </div>
          <div class="swatch-center">
            {{ ["Aa", "Bb", "Cc", "Dd", "Ee"][index]
            }}<span>{{
              [
                "The foundation",
                "A softer side",
                "The wild card",
                "A little energy",
                "The grounding",
              ][index]
            }}</span>
          </div>
          <div class="swatch-bottom">
            <button
              class="hex"
              :aria-label="`Copy ${color}`"
              @click="copy(color, `${color} copied.`)"
            >
              {{ color }} <span>↗</span></button
            ><label class="color-picker"
              ><span class="sr-only">Edit color {{ index + 1 }}</span
              ><input
                type="color"
                :value="color"
                @input="editColor(index, $event.target.value)"
            /></label>
          </div>
        </article>
      </section>
      <div class="palette-tools">
        <div>
          <button :disabled="!history.length" @click="undo">↶ Undo</button
          ><span class="tool-tip"
            >Lock a color. Shuffle the rest. Make it yours.</span
          >
        </div>
        <div>
          <button @click="copy(cssVariables(colors), 'CSS variables copied.')">
            Copy CSS</button
          ><button @click="share">Share ↗</button
          ><button class="outlined" @click="exportCss">Export CSS ↓</button>
        </div>
      </div>
      <section class="workbench">
        <div class="preview" :style="previewStyle">
          <span class="eyebrow">THE LIVE PREVIEW</span>
          <h2>Less ordinary.<br />More <em>you.</em></h2>
          <p>
            Every good idea deserves a color story.<br />This one is just
            getting started.
          </p>
          <span
            class="preview-pill"
            :style="{ borderColor: colors[foreground] }"
            >YOUR NEXT GOOD IDEA ↗</span
          >
          <div
            class="preview-orbit"
            aria-hidden="true"
            :style="{ borderColor: colors[foreground] }"
          >
            <span :style="{ background: colors[2] }"></span>
          </div>
        </div>
        <div class="contrast-panel">
          <p class="eyebrow">LOOKS GOOD. READS WELL.</p>
          <h2>A little clarity.</h2>
          <p>Check how your colors work together.</p>
          <div class="select-row">
            <label
              >Text color<select v-model="foreground">
                <option
                  v-for="(color, index) in colors"
                  :key="index"
                  :value="index"
                >
                  {{ index + 1 }} · {{ color }}
                </option>
              </select></label
            ><button
              class="swap"
              aria-label="Swap text and background"
              @click="[foreground, background] = [background, foreground]"
            >
              ⇄</button
            ><label
              >Background<select v-model="background" aria-label="Background">
                <option
                  v-for="(color, index) in colors"
                  :key="index"
                  :value="index"
                >
                  {{ index + 1 }} · {{ color }}
                </option>
              </select></label
            >
          </div>
          <div class="ratio">
            <strong>{{ ratio.toFixed(2) }}<span>:1</span></strong
            ><span class="rating">{{
              ratio >= 7
                ? "AAA — EXCELLENT"
                : ratio >= 4.5
                  ? "AA — GOOD TO GO"
                  : ratio >= 3
                    ? "LARGE TEXT ONLY"
                    : "NEEDS MORE CONTRAST"
            }}</span>
          </div>
          <div class="contrast-detail">
            <span
              >Normal text
              <b>{{ ratio >= 4.5 ? "AA PASS" : "AA FAIL" }}</b></span
            ><span
              >Large text <b>{{ ratio >= 3 ? "AA PASS" : "AA FAIL" }}</b></span
            ><span
              >Enhanced <b>{{ ratio >= 7 ? "AAA PASS" : "AAA FAIL" }}</b></span
            >
          </div>
          <p class="fine-print">
            WCAG contrast checks use sRGB relative luminance. Large text means
            at least 18pt, or 14pt bold.
          </p>
        </div>
      </section>
      <form class="save-bar" @submit.prevent="save">
        <div>
          <h2>That one&apos;s a keeper.</h2>
          <p>Save this palette to your shelf on this device.</p>
        </div>
        <label
          ><span class="sr-only">Palette name</span
          ><input
            v-model="paletteName"
            placeholder="Give your palette a name…"
            maxlength="60" /></label
        ><button class="generate" type="submit">
          Save palette <span>+</span>
        </button>
      </form>
    </template>
    <section v-else class="library">
      <p class="eyebrow">A FEW GOOD FINDS</p>
      <h1>Your <em>shelf.</em></h1>
      <p>Color stories worth coming back to. Saved in this browser.</p>
      <div v-if="!saved.length" class="empty">
        <span>✳</span>
        <h2>A blank canvas. Nice.</h2>
        <p>Save a palette from the playground to start your collection.</p>
        <button class="generate" @click="tab = 'playground'">
          Find your colors ↗
        </button>
      </div>
      <div class="shelf-grid">
        <article
          v-for="palette in saved"
          :key="palette.id"
          class="saved-palette"
        >
          <button
            class="mini-swatches"
            :aria-label="`Load ${palette.name}`"
            @click="loadPalette(palette)"
          >
            <span
              v-for="(color, index) in palette.colors"
              :key="index"
              :style="{ background: color }"
            ></span>
          </button>
          <div>
            <h2>{{ palette.name }}</h2>
            <button
              :aria-label="`Delete ${palette.name}`"
              @click="persist(saved.filter((item) => item.id !== palette.id))"
            >
              ×
            </button>
          </div>
          <button @click="loadPalette(palette)">Open palette ↗</button>
        </article>
      </div>
    </section>
    <p class="status" role="status">{{ message }}</p>
  </main>
  <footer>
    <span class="wordmark">pigment<span>®</span></span>
    <p>A SMALL TOOL. A WHOLE SPECTRUM.</p>
    <a href="https://github.com/goshkaaaa/pigment">View source ↗</a>
  </footer>
</template>
