import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || "texwell-libs");
const outputRoot = path.resolve(process.argv[3] || "dist");
const aliases = JSON.parse(fs.readFileSync(path.join(sourceRoot, "compatibility.json"), "utf8"));
const filenames = fs.readdirSync(sourceRoot)
  .filter(name => name.endsWith(".sty") || name.endsWith(".ltx"))
  .sort((a, b) => a.localeCompare(b));
const files = [];
const parts = [];
let offset = 0;

for (const name of filenames) {
  const bytes = fs.readFileSync(path.join(sourceRoot, name));
  files.push({ name, offset, length: bytes.length });
  parts.push(bytes);
  offset += bytes.length;
}

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "texwell-libs.bundle"), Buffer.concat(parts));
fs.writeFileSync(path.join(outputRoot, "texwell-libs-index.json"), JSON.stringify({ version: 1, bytes: offset, aliases, files }, null, 2));
console.log(`Bundled ${files.length} TeXwell libraries (${offset} bytes).`);
