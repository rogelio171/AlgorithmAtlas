import type { Language } from "../algorithmData";

export type CodeSample = {
  code: string;
  highlights: Record<string, number[]>;
};

export type RawSamples = Record<string, Record<Language, string>>;

export function compileSample(source: string): CodeSample {
  const highlights: Record<string, number[]> = {};
  const lines = source.trim().split("\n").map((line, index) => {
    const marker = line.match(/^(\s*)§([^§]+)§/);
    if (!marker) return line;
    for (const key of marker[2].split(",")) {
      (highlights[key] ??= []).push(index + 1);
    }
    return marker[1] + line.slice(marker[0].length);
  });
  return { code: lines.join("\n"), highlights };
}
