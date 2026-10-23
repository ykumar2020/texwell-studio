import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || ".tmp_texlive/extract");
const outputRoot = path.resolve(process.argv[3] || "dist");
const allowed = new Set([".cls", ".clo", ".sty", ".def", ".cfg", ".fd", ".tfm", ".pfb", ".map", ".enc"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const selected = walk(sourceRoot)
  .filter(filename => allowed.has(path.extname(filename).toLowerCase()))
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
const compatibilitySources = new Map([
  ["amsmath.sty", selected.find(filename => path.basename(filename) === "amsmath-2018-12-01.sty")],
  ["graphics.sty", selected.find(filename => path.basename(filename) === "graphics-2017-06-25.sty")],
]);

const seen = new Set();
const parts = [];
const files = [];
let offset = 0;

for (const filename of selected) {
  const name = path.basename(filename);
  if (seen.has(name)) throw new Error(`Duplicate TeX runtime filename: ${name}`);
  seen.add(name);
  const bytes = fs.readFileSync(compatibilitySources.get(name) || filename);
  parts.push(bytes);
  files.push({ name, offset, length: bytes.length });
  offset += bytes.length;
}

const mapNames = ["cm.map", "cmextra.map"];
const mapBytes = Buffer.concat(mapNames.map(name => {
  const record = files.find(file => file.name === name);
  if (!record) throw new Error(`Required font map missing: ${name}`);
  return parts[files.indexOf(record)];
}));
parts.push(mapBytes);
files.push({ name: "pdftex.map", offset, length: mapBytes.length });
offset += mapBytes.length;

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "tex-core.bundle"), Buffer.concat(parts));
fs.writeFileSync(path.join(outputRoot, "tex-core-index.json"), JSON.stringify({ version: 1, bytes: offset, files }, null, 2));
console.log(`Bundled ${files.length} TeX runtime files (${offset} bytes).`);
