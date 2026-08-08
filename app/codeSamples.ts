import type { Language } from "./algorithmData";
import { graphSamples } from "./code/graphs.ts";
import { recursionSamples } from "./code/recursion.ts";
import { compileSample, type CodeSample } from "./code/sample.ts";
import { searchSamples } from "./code/search.ts";
import { sortingSamples } from "./code/sorting.ts";
import { treeSamples } from "./code/trees.ts";

const sources = {
  ...searchSamples,
  ...sortingSamples,
  ...treeSamples,
  ...graphSamples,
  ...recursionSamples,
};

const samples = Object.fromEntries(
  Object.entries(sources).map(([id, languages]) => [
    id,
    Object.fromEntries(
      Object.entries(languages).map(([language, source]) => [language, compileSample(source)]),
    ),
  ]),
) as Record<string, Record<Language, CodeSample>>;

export function getCodeSample(id: string, language: Language): CodeSample {
  return samples[id][language];
}
