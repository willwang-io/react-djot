import { createElement, useEffect, useRef, useState } from "react";
import { Djot, type DjotComponents } from "@willwang-io/react-djot";

function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const merged = parts.filter(Boolean).join(" ");
  return merged.length > 0 ? merged : undefined;
}

interface MathJaxGlobal {
  startup?: {
    promise?: Promise<unknown>;
  };
  typesetPromise?: (elements?: Element[]) => Promise<unknown>;
}

declare global {
  interface Window {
    MathJax?: MathJaxGlobal & {
      options?: {
        processHtmlClass?: string;
      };
      tex?: {
        displayMath?: string[][];
        inlineMath?: string[][];
      };
    };
  }
}

const MATHJAX_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
let mathJaxLoaderPromise: Promise<void> | undefined;

function ensureMathJaxLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.MathJax?.typesetPromise) {
    return Promise.resolve();
  }

  if (mathJaxLoaderPromise) {
    return mathJaxLoaderPromise;
  }

  window.MathJax = {
    ...window.MathJax,
    options: {
      ...window.MathJax?.options,
      processHtmlClass: "math"
    },
    tex: {
      ...window.MathJax?.tex,
      displayMath: [["\\[", "\\]"]],
      inlineMath: [["\\(", "\\)"]]
    }
  };

  mathJaxLoaderPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-mathjax="true"]');
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }
      existingScript.addEventListener(
        "load",
        () => {
          existingScript.dataset.loaded = "true";
          resolve();
        },
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load MathJax script.")),
        {
          once: true
        }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.mathjax = "true";
    script.src = MATHJAX_SCRIPT_SRC;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error("Failed to load MathJax script.")), {
      once: true
    });
    document.head.append(script);
  });

  return mathJaxLoaderPromise;
}

const demoComponents: DjotComponents = {
  heading: ({ children, className, level, ...props }) => {
    const clamped = Math.max(1, Math.min(6, level));
    const tag = `h${clamped}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return createElement(
      tag,
      { ...props, className: joinClassName("heading", className) },
      children
    );
  },
  mark: ({ children, className, ...props }) => (
    <mark {...props} className={joinClassName("mark", className)}>
      {children}
    </mark>
  ),
  blockquote: ({ children, className, ...props }) => (
    <blockquote {...props} className={joinClassName("quote", className)}>
      {children}
    </blockquote>
  ),
  code_block: ({ className, language, value, ...props }) => (
    <pre {...props} className={joinClassName("codeBlock", className)}>
      <code data-language={language}>{value}</code>
    </pre>
  )
};

const fence = "```";

const initialSource = `# react-djot live editor

Edit Djot in the left pane. The rendered result updates in the right pane.

## Inline syntax

This sentence has _emphasis_, *strong*, and \`verbatim\`.
{=highlighted=} + H~2~O + x^2^ + {-remove-}{+insert+}.

Autolinks:
<https://github.com/willwang-io/react-djot>
<me@example.com>

## Blocks

::: warning
This is a fenced div with class "warning".
It can contain multiple paragraphs.
:::

> Block quote with list:
> 1. first
> 2. second

- [ ] task todo
- [X] task done

| fruit  | price |
|--------|------:|
| apple  |     4 |
| banana |    10 |

## Math

Inline: $\`e=mc^2\`.

Display:
$$\` \\int_{0}^{\\infty} e^{-x^2}\\,dx=\\frac{\\sqrt{\\pi}}{2} \`

${fence}ts
const prices = [4, 10];
const total = prices.reduce((sum, n) => sum + n, 0);
console.log(total);
${fence}`;

export default function App() {
  const [source, setSource] = useState(initialSource);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = previewRef.current;
    if (!target) {
      return;
    }

    let cancelled = false;
    void (async () => {
      await ensureMathJaxLoaded();
      if (cancelled) {
        return;
      }

      const mathJax = window.MathJax;
      if (!mathJax) {
        return;
      }

      if (mathJax.startup?.promise) {
        await mathJax.startup.promise;
      }
      if (cancelled) {
        return;
      }

      await mathJax.typesetPromise?.([target]);
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <>
      <a
        className="githubCorner"
        href="https://github.com/willwang-io/react-djot"
        target="_blank"
        rel="noreferrer"
        aria-label="Open react-djot repository on GitHub"
      >
        <svg viewBox="0 0 250 250" aria-hidden="true">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
          <path
            className="octo-arm"
            fill="currentColor"
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0
            123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
          />
          <path
            className="octo-body"
            fill="currentColor"
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4
            142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4
            163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4
            C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0
            205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1
            C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
          />
        </svg>
      </a>
      <main className="page">
        <h1 className="title">react-djot live editor</h1>
        <section className="workspace">
          <section className="pane">
            <header className="paneHeader">
              <span className="paneTitle">Editor</span>
              <button
                type="button"
                className="iconButton"
                onClick={() => setSource("")}
                aria-label="Clear editor"
                title="Clear editor"
                disabled={source.length === 0}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.75 9.75l4.5 4.5" />
                  <path d="M14.25 9.75l-4.5 4.5" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
            </header>
            <textarea
              className="editor"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              aria-label="Djot editor"
              spellCheck={false}
            />
          </section>
          <section className="pane preview">
            <header className="paneHeader">
              <span className="paneTitle">Preview</span>
            </header>
            <div ref={previewRef} className="renderPane">
              <Djot components={demoComponents}>{source}</Djot>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
