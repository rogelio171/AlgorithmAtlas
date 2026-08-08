import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultThemeId, isThemeId, themeById, themes } from "../app/themes.ts";

test("ten themes with unique ids and Tokyo Night as the default", () => {
  assert.equal(themes.length, 10);
  assert.equal(new Set(themes.map(theme => theme.id)).size, 10);
  assert.equal(defaultThemeId, "tokyo");
  assert.equal(themes[0].id, "tokyo");
  assert.equal(themeById.tokyo.label, "Tokyo Night");
  assert.ok(isThemeId("swiss"));
  assert.ok(!isThemeId("does-not-exist"));
});

test("globals.css defines a token block for every non-default theme", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const theme of themes) {
    if (theme.id === defaultThemeId) continue;
    assert.ok(css.includes(`[data-theme="${theme.id}"]`), `missing CSS block for ${theme.id}`);
  }
});

test("every theme carries a two-tone picker swatch", () => {
  for (const theme of themes) {
    assert.equal(theme.dot.length, 2, `${theme.id}.dot`);
    for (const color of theme.dot) {
      assert.ok(/^#[0-9a-f]{6}$/i.test(color), `${theme.id}.dot ${color}`);
    }
    assert.ok(theme.label.length, `${theme.id}.label`);
  }
});

function themeTokens(css, id) {
  const start = id === defaultThemeId ? css.indexOf(":root{") : css.indexOf(`[data-theme="${id}"]{`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}

test("themes define the tokens the 2D stage renders with", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const required = ["--deep", "--line", "--accent", "--warn", "--ok", "--raise", "--on-accent"];
  for (const theme of themes) {
    const block = css.slice(
      theme.id === defaultThemeId ? css.indexOf(":root{") : css.indexOf(`[data-theme="${theme.id}"]{`),
      css.indexOf("}", theme.id === defaultThemeId ? css.indexOf(":root{") : css.indexOf(`[data-theme="${theme.id}"]{`)),
    );
    for (const token of required) {
      assert.ok(block.includes(`${token}:`), `${theme.id} is missing ${token}`);
    }
  }
});

test("pending, active, and settled cubes are distinct in every theme", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const base = themeTokens(css, defaultThemeId);
  for (const theme of themes) {
    const tokens = { ...base, ...themeTokens(css, theme.id) };
    const pending = (tokens.cube ?? "").startsWith("var(") ? tokens.accent : tokens.cube ?? tokens.accent;
    const states = [pending, tokens.warn, tokens.ok].map(value => value.toLowerCase());
    assert.equal(new Set(states).size, 3, `${theme.id} reuses a color across cube states: ${states.join(" / ")}`);
  }
});
