const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
let resolveReady;
let resolveCompile;
const ready = new Promise(resolve => { resolveReady = resolve; });

global.self = global;
global.close = () => {};
global.fetch = undefined;
global.XMLHttpRequest = class MissingPackageProbe {
  open(method, url) { this.url = url; }
  send() { this.status = 301; this.response = new ArrayBuffer(0); }
  getResponseHeader() { return null; }
};
global.postMessage = message => {
  if (!message.cmd && message.result === "ok") resolveReady();
  if (message.cmd === "compile") resolveCompile(message);
};

require(path.join(projectRoot, "dist", "swiftlatexpdftex.js"));

function command(cmd, url, src) {
  global.onmessage({ data: { cmd, url, src } });
}

(async () => {
  await ready;
  const index = JSON.parse(fs.readFileSync(path.join(projectRoot, "dist", "tex-core-index.json"), "utf8"));
  const bundle = fs.readFileSync(path.join(projectRoot, "dist", "tex-core.bundle"));
  for (const file of index.files) command("writefile", file.name, bundle.subarray(file.offset, file.offset + file.length));
  const libsIndex = JSON.parse(fs.readFileSync(path.join(projectRoot, "dist", "texwell-libs-index.json"), "utf8"));
  const libsBundle = fs.readFileSync(path.join(projectRoot, "dist", "texwell-libs.bundle"));
  for (const file of libsIndex.files) command("writefile", file.name, libsBundle.subarray(file.offset, file.offset + file.length));
  command("writefile", "swiftlatexpdftex.fmt", fs.readFileSync(path.join(projectRoot, "dist", "swiftlatexpdftex.fmt")));
  const source = String.raw`\documentclass{article}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage[margin=1in]{geometry}
\usepackage{xcolor,booktabs}
\usepackage{hyperref}
\usepackage{url}
\usepackage{fancyhdr}
\usepackage{caption}
\usepackage{setspace}
\usepackage{enumitem}
\usepackage{parskip}
\usepackage{mathtools}
\pagestyle{fancy}
\fancyhead{TeXwell compatibility test}
\fancyfoot{\thepage}
\begin{document}
\geometry{left=1in,right=1in}
\onehalfspacing
\textcolor{teal}{Offline core test}: $E=mc^2$. \href{https://texwell-studio.vercel.app}{TeXwell Studio}.
\DeclarePairedDelimiter{\abs}{\lvert}{\rvert}
\[\int_0^1 x^2\,dx=\frac{1}{3},\qquad \abs*{-3}\coloneqq 3\]
\setlist[itemize]{leftmargin=*}
\begin{itemize}\item Compatible list configuration.\end{itemize}
\par\bigskip\noindent\begingroup\setlength{\fboxsep}{12pt}\pdfliteral direct {1 0 0 RG 1 0 0 rg}\fbox{\parbox{0.82\linewidth}{\centering\bfseries\Large MISSING SOURCE FILE\par\vspace{8pt}\normalfont\ttfamily\small\detokenize{chapters/results.tex}\par\vspace{8pt}\normalfont\itshape TeXwell used an empty default so this document could still compile.}}\pdfliteral direct {0 0 0 RG 0 0 0 rg}\endgroup\par\bigskip
\begin{table}[h]\centering\caption{Compatibility table}\begin{tabular}{lr}\toprule Item & Value\\\midrule Signal & 42\\\bottomrule\end{tabular}\end{table}
\end{document}`;
  const rewritten = source.replace(/\\usepackage(\s*\[[^\]]*\])?\s*\{([^}]+)\}/g, (match, options = "", names) => {
    const mapped = names.split(",").map(name => libsIndex.aliases[name.trim()] || name.trim());
    return `\\usepackage${options}{${mapped.join(",")}}`;
  });
  command("writefile", "main.tex", rewritten);
  command("setmainfile", "main.tex");
  const resultPromise = new Promise(resolve => { resolveCompile = resolve; });
  command("compilelatex");
  const result = await resultPromise;
  if (result.status !== 0 || !result.pdf) {
    console.error(result.log);
    process.exitCode = 1;
  } else {
    console.log(`SwiftLaTeX core + TeXwell libraries test passed (${result.pdf.byteLength} PDF bytes).`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
