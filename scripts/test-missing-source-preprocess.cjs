const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const app = fs.readFileSync(path.join(__dirname, "..", "dist", "app.js"), "utf8");
const names = ["projectDirectory", "normalizeProjectPath", "sourceCandidates", "missingSourceTemplate", "substituteMissingSources"];
const definitions = app.split(/\r?\n/).filter(line => names.some(name => line.startsWith(`function ${name}(`)));
assert.equal(definitions.length, names.length, "Expected to load every source-recovery function from app.js");

const sandbox = {};
vm.runInNewContext(`${definitions.join("\n")}\nthis.preprocess = substituteMissingSources;`, sandbox);
const source = String.raw`\documentclass{article}
\input{missing-preamble}
\begin{document}
\input{chapters/existing}
\include{chapters/missing-results}
\end{document}`;
const result = sandbox.preprocess(source, "main.tex", new Set(["main.tex", "chapters/existing.tex"]));

assert.equal(result.missing.length, 2);
assert.match(result.source, /using empty default/);
assert.match(result.source, /MISSING SOURCE FILE/);
assert.match(result.source, /chapters\/missing-results/);
assert.match(result.source, /\\input\{chapters\/existing\}/);
assert.doesNotMatch(result.source, /\\input\{missing-preamble\}/);
assert.doesNotMatch(result.source, /\\include\{chapters\/missing-results\}/);
console.log("Missing-source preprocessing test passed.");
