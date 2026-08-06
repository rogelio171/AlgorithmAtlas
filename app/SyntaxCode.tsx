import type { Language } from "./algorithmData";
import type { CodeSample } from "./code/sample";

const keywords: Record<Language, Set<string>> = {
  typescript: new Set("function return let const if else for while new class interface type undefined true false in of".split(" ")),
  python: new Set("def return if else elif for while in not and or is None True False class import from".split(" ")),
  go: new Set("func return var const if else for range type struct map true false nil package".split(" ")),
  java: new Set("static public private protected return int void boolean if else for while new class null true false".split(" ")),
};

const types = new Set("number string boolean int Node Graph Map Set List Queue Deque Integer String void None".split(" "));
const tokenPattern = /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|===|!==|==|!=|<=|>=|=>|\+\+|--|&&|\|\||[+*/%?:=<>!-])/g;

function highlight(line: string, language: Language) {
  const nodes: React.ReactNode[] = []; let last = 0;
  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0, token = match[0];
    if (index > last) nodes.push(line.slice(last, index));
    let kind = "operator";
    if (token.startsWith("//") || token.startsWith("#")) kind = "comment";
    else if (/^["']/.test(token)) kind = "string";
    else if (/^\d/.test(token)) kind = "number";
    else if (keywords[language].has(token)) kind = "keyword";
    else if (types.has(token) || /^[A-Z]/.test(token)) kind = "type";
    else if (/^[A-Za-z_$]/.test(token)) kind = line.slice(index + token.length).trimStart().startsWith("(") ? "function" : "plain";
    nodes.push(<span className={`tok-${kind}`} key={`${index}-${token}`}>{token}</span>);
    last = index + token.length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes;
}

export function SyntaxCode({ sample, language, active }: { sample: CodeSample; language: Language; active: number[] }) {
  return <pre className="code-block" aria-label={`${language} source code`}>
    {sample.code.split("\n").map((line, index) => <code className={active.includes(index + 1) ? "active" : ""} key={index}>
      <span className="line-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="code-text">{highlight(line, language)}</span>
    </code>)}
  </pre>;
}
