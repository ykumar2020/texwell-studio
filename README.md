# TeXwell Studio

TeXwell Studio is a free, open-source, student-focused LaTeX editor and compiler. It keeps the familiar project/editor/PDF workflow while explaining compiler problems in plain language.

## Principles

- No subscription and no paid compilation API.
- No account required for local editing and compilation.
- LaTeX is compiled in the browser with WebAssembly.
- Source files stay on the student's device unless the student explicitly exports or shares them.
- Original branding and interface; this project is not affiliated with Overleaf.

## Run locally

Serve the `dist` directory with any static HTTP server:

```bash
python -m http.server 4173 --directory dist
```

Then open `http://localhost:4173`.

## Deployment

The site is static and can be deployed on Vercel's free Hobby tier. No backend compiler is required because pdfTeX runs in a browser Web Worker.

## Compiler

The vendored WebAssembly engine is from [SwiftLaTeX](https://github.com/SwiftLaTeX/SwiftLaTeX). Standard TeX files are retrieved on demand from the SwiftLaTeX TeX Live endpoint. The compiler engine and application source are open source; see `THIRD_PARTY_NOTICES.md` and the source headers for licensing details.

## PDF compression experiment

The Compression Lab performs a controlled A/B test entirely in the browser. It compiles the same LaTeX source with the same pdfTeX engine twice:

- Baseline: `\pdfcompresslevel=0` and `\pdfobjcompresslevel=0`.
- Optimized: `\pdfcompresslevel=9` and `\pdfobjcompresslevel=3`.

The interface reports both output sizes, build times, bytes saved, and percentage reduction, and lets the student download the optimized PDF. This first profile is lossless: it compresses PDF streams and object structure without resampling text, vectors, or raster images. A later raster-image experiment will add explicit quality measurements such as PSNR, SSIM, edge preservation, and OCR/text fidelity instead of claiming that lossy artifacts are absent without measuring them.

## Multi-file projects

Use **Files** in the project sidebar—or drag files onto the sidebar—to add multiple `.tex`, `.bib`, `.sty`, `.cls`, `.bst`, PNG, JPG, JPEG, and PDF files. Use **Folder** to import an extracted LaTeX project while preserving paths such as `figures/chart.png`. Uploaded text files can be edited directly, image assets receive an in-editor preview, and every project file is copied into the browser-local pdfTeX filesystem before compilation. Select any uploaded `.tex` file and choose **Use as main** to make it the compilation entry point. Project files and the selected main document are retained locally in IndexedDB.

## Dual PDF and HTML outputs

**Compile PDF** runs the browser-local pdfTeX engine. **Build HTML** converts the selected main document into a responsive web edition with a separate preview. The HTML converter expands local `\input` and `\include` files, carries referenced images and PDFs into the result, and exposes a project-artifact index. **ZIP** downloads a deployable static-site package containing `index.html`, `DEPLOY.txt`, and the complete project file tree. The package requires no TeX installation or application server after generation and can be hosted by any ordinary static web server.

## Status

This is an early prototype. Real browser-side PDF compilation, HTML web-edition generation, deployable ZIP export, compiler logs, persistent multi-file projects, image uploads, PDF download, reproducible lossless-compression testing, and responsive layouts are implemented. Raster artifact experiments and collaboration are planned.
