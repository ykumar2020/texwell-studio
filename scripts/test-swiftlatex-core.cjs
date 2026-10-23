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
  command("writefile", "swiftlatexpdftex.fmt", fs.readFileSync(path.join(projectRoot, "dist", "swiftlatexpdftex.fmt")));
  command("writefile", "main.tex", String.raw`\documentclass{article}
\usepackage{graphicx}
\usepackage{amsmath}
\begin{document}
Offline core test: $E=mc^2$.
\[\int_0^1 x^2\,dx=\frac{1}{3}\]
\end{document}`);
  command("setmainfile", "main.tex");
  const resultPromise = new Promise(resolve => { resolveCompile = resolve; });
  command("compilelatex");
  const result = await resultPromise;
  if (result.status !== 0 || !result.pdf) {
    console.error(result.log);
    process.exitCode = 1;
  } else {
    console.log(`SwiftLaTeX core test passed (${result.pdf.byteLength} PDF bytes).`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
