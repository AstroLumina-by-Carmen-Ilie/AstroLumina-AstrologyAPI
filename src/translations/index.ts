import type { Request } from "express";
import en from "./en.js";
import ro from "./ro.js";

export interface Translations {
  types: Record<string, string>;
  elements: Record<string, string>;
  planets: Record<string, string>;
  signs: Record<string, string>;
  long_signs: Record<string, string>;
  houses: Record<string, string>;
  aspects: Record<string, string>;
  lunar_phases: Record<string, string>;
}

const translationsMap: Record<string, Translations> = {
  en: en as Translations,
  ro: ro as Translations,
};

export const VALID_LANGUAGES = ["ro", "en"] as const;
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];

export function validateLanguage(
  lang: string | undefined,
): lang is ValidLanguage {
  return VALID_LANGUAGES.includes(lang as ValidLanguage);
}

export function loadTranslations(lang: string): Translations {
  return translationsMap[lang] ?? translationsMap["en"]!;
}

export function getLanguage(req: Request): string {
  return String(req.params["lang"] ?? "").toLowerCase();
}
