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

## Status

This is an early prototype. Real browser-side PDF compilation, compiler logs, local persistence, PDF download, and responsive layouts are implemented. Multi-file uploads and collaboration are planned.
