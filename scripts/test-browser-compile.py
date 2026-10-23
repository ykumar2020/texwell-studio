from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4319/"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def compile_current(page):
    page.locator("#compileBtn").click()
    page.locator("#compileChoices button").first.click()
    page.wait_for_function(
        """() => {
          const button = document.querySelector('#compileBtn');
          return button && !button.disabled && !button.classList.contains('busy');
        }""",
        timeout=120_000,
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=str(CHROME),
        args=["--disable-gpu"],
    )
    page = browser.new_page()
    browser_errors = []
    page.on("pageerror", lambda error: browser_errors.append(str(error)))
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
    page.locator("#compileBtn").wait_for(state="visible")
    page.wait_for_function(
        "() => !document.querySelector('#compileBtn').disabled", timeout=120_000
    )

    compile_current(page)
    first_log = page.locator("#rawLog").inner_text()
    assert "article.cls' not found" not in first_log, first_log
    assert page.locator("#realPdf").is_visible(), first_log

    missing_figure_source = r"""\documentclass{article}
\usepackage{graphicx}
\begin{document}
\section{Fallback test}
\includegraphics[width=.5\linewidth]{missing-demo.png}
\end{document}
"""
    page.locator("#sourceEditor").fill(missing_figure_source)
    compile_current(page)
    second_log = page.locator("#rawLog").inner_text()
    assert "article.cls' not found" not in second_log, second_log
    assert page.locator("#realPdf").is_visible(), second_log
    assert page.locator("#issueCount").inner_text() == "1"
    assert "placeholder" in page.locator("#logSummary").inner_text().lower()
    assert not browser_errors, browser_errors
    print("browser compile: article class and missing-figure fallback passed")
    browser.close()
