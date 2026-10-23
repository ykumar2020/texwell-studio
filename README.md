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

## Status

This is an early prototype. Real browser-side PDF compilation, compiler logs, local persistence, PDF download, reproducible lossless-compression testing, and responsive layouts are implemented. Multi-file uploads, raster artifact experiments, and collaboration are planned.
