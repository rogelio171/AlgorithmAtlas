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

test("every scene palette is complete", () => {
  const numericKeys = ["stage", "floor", "cubeBase", "cubeEdge", "emissive", "pending", "active", "settled", "dimmed", "link", "linkActive", "spot", "rim"];
  for (const theme of themes) {
    for (const key of numericKeys) {
      assert.equal(typeof theme.scene[key], "number", `${theme.id}.scene.${key}`);
    }
    assert.equal(theme.scene.grid.length, 2, `${theme.id}.scene.grid`);
    assert.equal(theme.scene.hemi.length, 2, `${theme.id}.scene.hemi`);
    assert.ok(theme.scene.labelBg.startsWith("rgba("), `${theme.id}.scene.labelBg`);
    assert.ok(/^#[0-9a-f]{6}$/i.test(theme.scene.labelText), `${theme.id}.scene.labelText`);
    assert.equal(theme.dot.length, 2, `${theme.id}.dot`);
  }
});
