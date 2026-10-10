// Unit tests for the translation helpers: language validation, fallback to
// English for unknown languages, and ro/en structural parity.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";
import {
  VALID_LANGUAGES,
  getLanguage,
  loadTranslations,
  validateLanguage,
} from "../src/translations/index.js";

function stubRequest(lang: unknown): Request {
  return { params: { lang } } as unknown as Request;
}

describe("validateLanguage", () => {
  it("accepts ro and en", () => {
    assert.equal(validateLanguage("ro"), true);
    assert.equal(validateLanguage("en"), true);
  });

  it("rejects anything else, including undefined", () => {
    assert.equal(validateLanguage("de"), false);
    assert.equal(validateLanguage("RO"), false);
    assert.equal(validateLanguage(undefined), false);
  });

  it("matches the VALID_LANGUAGES tuple", () => {
    assert.deepEqual([...VALID_LANGUAGES], ["ro", "en"]);
  });
});

describe("loadTranslations", () => {
  it("returns Romanian content for ro", () => {
    assert.equal(loadTranslations("ro").signs["Ari"], "Berbec");
  });

  it("falls back to English for unknown languages", () => {
    assert.equal(loadTranslations("xx").signs["Ari"], "Aries");
  });

  it("keeps ro structurally identical to en", () => {
    const en = loadTranslations("en");
    const ro = loadTranslations("ro");
    assert.deepEqual(Object.keys(ro).sort(), Object.keys(en).sort());
    for (const section of Object.keys(en) as (keyof typeof en)[]) {
      assert.deepEqual(
        Object.keys(ro[section]).sort(),
        Object.keys(en[section]).sort(),
      );
    }
  });

  it("translates all twelve zodiac signs in both languages", () => {
    assert.equal(Object.keys(loadTranslations("en").signs).length, 12);
    assert.equal(Object.keys(loadTranslations("ro").signs).length, 12);
  });
});

describe("getLanguage", () => {
  it("lowercases the lang route param", () => {
    assert.equal(getLanguage(stubRequest("RO")), "ro");
  });

  it("returns an empty string when the param is missing", () => {
    assert.equal(getLanguage(stubRequest(undefined)), "");
  });
});
