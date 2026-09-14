import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  oppositeAppearance,
  parsePreference,
  resolveAppearance,
} from "./appearance.ts";

describe("parsePreference", () => {
  it("keeps an explicit light or dark value", () => {
    assert.equal(parsePreference("light"), "light");
    assert.equal(parsePreference("dark"), "dark");
  });

  it("treats anything else as system", () => {
    assert.equal(parsePreference(null), "system");
    assert.equal(parsePreference(""), "system");
    assert.equal(parsePreference("system"), "system");
    assert.equal(parsePreference("nope"), "system");
  });
});

describe("resolveAppearance", () => {
  it("follows the OS when preference is system", () => {
    assert.equal(resolveAppearance("system", true), "dark");
    assert.equal(resolveAppearance("system", false), "light");
  });

  it("ignores the OS when preference is explicit", () => {
    assert.equal(resolveAppearance("light", true), "light");
    assert.equal(resolveAppearance("dark", false), "dark");
  });
});

describe("oppositeAppearance", () => {
  it("flips light and dark", () => {
    assert.equal(oppositeAppearance("light"), "dark");
    assert.equal(oppositeAppearance("dark"), "light");
  });
});
