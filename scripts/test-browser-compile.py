import os
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("TEXWELL_TEST_URL", "http://127.0.0.1:4319/")
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def compile_current(page):
    page.locator("#compileBtn").click()
    page.locator("#compileChoices button").first.click()
    try:
        page.wait_for_function(
            """() => {
              const button = document.querySelector('#compileBtn');
              return button && !button.disabled && !button.classList.contains('busy');
            }""",
            timeout=120_000,
        )
    except Exception:
        print("compile button:", page.locator("#compileBtn").inner_text())
        print("health:", page.locator("#healthText").inner_text())
        print("raw log:", page.locator("#rawLog").inner_text()[:3000])
        raise


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=str(CHROME),
        args=["--disable-gpu"],
    )
    page = browser.new_page()
    browser_errors = []
    console_messages = []
    failed_requests = []
    page.on("pageerror", lambda error: browser_errors.append(str(error)))
    page.on("console", lambda message: console_messages.append(message.text))
    page.on(
        "requestfailed",
        lambda request: failed_requests.append(
            f"{request.url}: {request.failure or 'request failed'}"
        ),
    )
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

    spaced_source = r"""\documentclass{article}
\begin{document}
Uploaded filename with spaces and parentheses compiles safely.
\end{document}
"""
    page.locator("#fileUpload").set_input_files(
        {
            "name": "main (5).tex",
            "mimeType": "application/x-tex",
            "buffer": spaced_source.encode("utf-8"),
        }
    )
    page.locator("#compileBtn").click()
    page.locator("#compileChoices button", has_text="main (5).tex").click()
    page.wait_for_function(
        """() => {
          const button = document.querySelector('#compileBtn');
          return button && !button.disabled && !button.classList.contains('busy');
        }""",
        timeout=120_000,
    )
    spaced_log = page.locator("#rawLog").inner_text()
    assert "I couldn't open file name" not in spaced_log, spaced_log
    assert page.locator("#realPdf").is_visible(), spaced_log
    assert not browser_errors, browser_errors
    unexpected_failures = [
        failure
        for failure in failed_requests
        if not (failure.startswith("blob:") and "ERR_ABORTED" in failure)
    ]
    assert not unexpected_failures, unexpected_failures
    print("browser compile: article class, missing-figure fallback, and spaced entry filename passed")
    print("browser console:", console_messages[-12:])
    browser.close()
