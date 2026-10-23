# TeXwell Compatibility Library

These packages are clean-room, independently written implementations of common LaTeX interfaces. TeXwell maps familiar package requests to these files during browser compilation:

| Requested package | TeXwell implementation | Supported common surface |
| --- | --- | --- |
| `geometry` | `texwell-geometry` | margins, individual edges, A4/Letter, landscape, `\geometry` |
| `xcolor` | `texwell-xcolor` | standard `color` commands and common extra named colors |
| `booktabs` | `texwell-booktabs` | top/mid/bottom rules, `\cmidrule`, spacing |
| `hyperref`, `url` | `texwell-hyperref`, `texwell-url` | URI links, URLs, paths, `\autoref`, safe setup no-op |
| `fancyhdr` | `texwell-fancyhdr` | shared header/footer fields and fancy page style |
| `caption` | `texwell-caption` | standard captions, `\captionof`, safe setup no-op |
| `setspace` | `texwell-setspace` | single, one-and-a-half, double, and custom spacing |
| `enumitem` | `texwell-enumitem` | safe common list-configuration commands |
| `parskip` | `texwell-parskip` | paragraph spacing without indentation |
| `mathtools` | `texwell-mathtools` | AMS math plus paired delimiters and common relation symbols |

Compatibility means the documented common subset above, not every command, option, patch, or edge case of the similarly named third-party packages. Unsupported package requests are left unchanged so an uploaded project package can satisfy them.

Copyright 2026 TeXwell contributors. Licensed with this project under GNU AGPL-3.0.
