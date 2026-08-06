import { getCode, type Language } from "./algorithmData";
import { searchSamples } from "./code/search";
import { compileSample, type CodeSample } from "./code/sample";

const search = Object.fromEntries(
  Object.entries(searchSamples).map(([id, languages]) => [
    id,
    Object.fromEntries(
      Object.entries(languages).map(([language, source]) => [language, compileSample(source)]),
    ),
  ]),
) as Record<string, Record<Language, CodeSample>>;

function cleanLine(line: string) {
  return line
    .replace(/\b(if|for|while|switch)\(/g, "$1 (")
    .replace(/,(?=\S)/g, ", ")
    .replace(/\)(?=\{)/g, ") ")
    .replace(/\belse(?=\{)/g, "else ")
    .replace(/=(?!=|>)/g, " = ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBraced(source: string) {
  const output: string[] = [];
  let buffer = "", indent = 0, parens = 0, quote = "";
  const push = () => {
    const line = cleanLine(buffer);
    if (line) output.push("  ".repeat(indent) + line);
    buffer = "";
  };
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      buffer += character;
      if (character === quote && source[index - 1] !== "\\") quote = "";
    } else if (character === '"' || character === "'") {
      quote = character; buffer += character;
    } else if (character === "(" || character === "[") {
      parens++; buffer += character;
    } else if (character === ")" || character === "]") {
      parens--; buffer += character;
    } else if (character === "{" && parens === 0) {
      buffer += " {"; push(); indent++;
    } else if (character === "}" && parens === 0) {
      push(); indent = Math.max(0, indent - 1); output.push("  ".repeat(indent) + "}");
    } else if (character === ";" && parens === 0) {
      buffer += ";"; push();
    } else if (character === "\n") push();
    else buffer += character;
  }
  push();
  return output.join("\n").replace(/}\n(\s*)else/g, "} else");
}

function formatPython(source: string) {
  const output: string[] = [];
  for (const sourceLine of source.split("\n")) {
    const leading = sourceLine.match(/^ */)?.[0].length ?? 0;
    for (const statement of sourceLine.trim().split(";")) {
      const parts = statement.split(/:(?=\S)/);
      output.push("  ".repeat(leading) + cleanLine(parts[0]) + (parts.length > 1 ? ":" : ""));
      if (parts.length > 1) {
        output.push("  ".repeat(leading + 1) + cleanLine(parts.slice(1).join(":")));
      }
    }
  }
  return output.filter(Boolean).join("\n");
}

const cues: Record<string, RegExp[]> = {
  setup: [/^(function|def|func|static)/],
  inspect: [/\bfor\b/, /\bwhile\b/],
  compare: [/\bif\b/, /<=|>=|===|==/],
  match: [/return/],
  missing: [/return -1/],
  pass: [/\bfor\b/],
  swap: [/temporary/, /\[.*\].*=.*\[/],
  select: [/key/],
  shift: [/cursor.*key/, /cursor \+ 1/],
  insert: [/insert/, /cursor \+ 1/],
  split: [/middle/, /slice/, /copyOfRange/],
  merge: [/merge/, /append/],
  pivot: [/pivot/],
  partition: [/boundary/],
  recurse: [/sort\(/, /walk\(/, /factorial\(/, /fibonacci\(/],
  visit: [/out/, /order/, /visited/],
  enqueue: [/queue.*(push|append|add)/],
  dequeue: [/shift|pop\(0\)|remove/],
  push: [/stack.*(push|append|extend)/],
  pop: [/stack.*pop/],
  settle: [/closest|min\(/],
  relax: [/Math\.min|min\(/, /candidate/],
  base: [/n ?<= ?1/, /nil|null|None/],
  return: [/return/],
  done: [/return/],
};

function inferHighlights(code: string) {
  const lines = code.split("\n");
  return Object.fromEntries(
    Object.entries(cues).map(([key, patterns]) => {
      const matches = lines
        .map((line, index) => (patterns.some(pattern => pattern.test(line)) ? index + 1 : 0))
        .filter(Boolean);
      return [key, matches.length ? matches : [1]];
    }),
  );
}

export function getCodeSample(id: string, language: Language): CodeSample {
  if (search[id]) return search[id][language];
  const raw = getCode(id, language);
  const code = language === "python" ? formatPython(raw) : formatBraced(raw);
  return { code, highlights: inferHighlights(code) };
}
