import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderNode } from "../src/renderNode";
import type { DjotComponents, DjotNode } from "../src/types";

function toHtml(node: DjotNode, components?: DjotComponents): string {
  return renderToStaticMarkup(<>{renderNode(node, { components })}</>);
}

describe("renderNode", () => {
  it("renders doc", () => {
    const node: DjotNode = {
      tag: "doc",
      children: [{ tag: "para", children: [{ tag: "str", text: "hello" }] }]
    };

    expect(toHtml(node)).toBe("<p>hello</p>");
  });

  it("renders para", () => {
    const node: DjotNode = {
      tag: "para",
      children: [{ tag: "str", text: "paragraph" }]
    };

    expect(toHtml(node)).toBe("<p>paragraph</p>");
  });

  it("renders section", () => {
    const node: DjotNode = {
      tag: "section",
      children: [
        { tag: "heading", level: 1, children: [{ tag: "str", text: "title" }] },
        { tag: "para", children: [{ tag: "str", text: "body" }] }
      ]
    };

    expect(toHtml(node)).toBe("<section><h1>title</h1><p>body</p></section>");
  });

  it("renders section with autoAttributes id", () => {
    const node: DjotNode = {
      tag: "section",
      autoAttributes: { id: "Hello-World" },
      children: [{ tag: "heading", level: 1, children: [{ tag: "str", text: "Hello World" }] }]
    };

    expect(toHtml(node)).toBe('<section id="Hello-World"><h1>Hello World</h1></section>');
  });

  it("prefers explicit section attributes over autoAttributes", () => {
    const node: DjotNode = {
      tag: "section",
      autoAttributes: { id: "auto-id" },
      attributes: { class: "manual", id: "manual-id" },
      children: [{ tag: "heading", level: 1, children: [{ tag: "str", text: "Hello" }] }]
    };

    expect(toHtml(node)).toBe('<section id="manual-id" class="manual"><h1>Hello</h1></section>');
  });

  it("renders div blocks with class from attributes", () => {
    const node: DjotNode = {
      tag: "div",
      attributes: { class: "warning" },
      children: [
        { tag: "para", children: [{ tag: "str", text: "Here is a paragraph." }] },
        { tag: "para", children: [{ tag: "str", text: "And here is another." }] }
      ]
    };

    expect(toHtml(node)).toBe(
      '<div class="warning"><p>Here is a paragraph.</p><p>And here is another.</p></div>'
    );
  });

  it("renders a simple pipe table row", () => {
    const node: DjotNode = {
      tag: "table",
      children: [
        { tag: "caption", children: [] },
        {
          tag: "row",
          head: false,
          children: [
            {
              tag: "cell",
              head: false,
              align: "default",
              children: [{ tag: "str", text: "1" }]
            },
            {
              tag: "cell",
              head: false,
              align: "default",
              children: [{ tag: "str", text: "2" }]
            }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe("<table><tbody><tr><td>1</td><td>2</td></tr></tbody></table>");
  });

  it("renders pipe tables with header and alignments", () => {
    const node: DjotNode = {
      tag: "table",
      children: [
        { tag: "caption", children: [] },
        {
          tag: "row",
          head: true,
          children: [
            {
              tag: "cell",
              head: true,
              align: "default",
              children: [{ tag: "str", text: "fruit" }]
            },
            {
              tag: "cell",
              head: true,
              align: "right",
              children: [{ tag: "str", text: "price" }]
            }
          ]
        },
        {
          tag: "row",
          head: false,
          children: [
            {
              tag: "cell",
              head: false,
              align: "default",
              children: [{ tag: "str", text: "apple" }]
            },
            {
              tag: "cell",
              head: false,
              align: "right",
              children: [{ tag: "str", text: "4" }]
            }
          ]
        },
        {
          tag: "row",
          head: false,
          children: [
            {
              tag: "cell",
              head: false,
              align: "default",
              children: [{ tag: "str", text: "banana" }]
            },
            {
              tag: "cell",
              head: false,
              align: "right",
              children: [{ tag: "str", text: "10" }]
            }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe(
      '<table><thead><tr><th>fruit</th><th style="text-align:right">price</th></tr></thead><tbody><tr><td>apple</td><td style="text-align:right">4</td></tr><tr><td>banana</td><td style="text-align:right">10</td></tr></tbody></table>'
    );
  });

  it("renders heading", () => {
    const node: DjotNode = {
      tag: "heading",
      level: 2,
      children: [{ tag: "str", text: "title" }]
    };

    expect(toHtml(node)).toBe("<h2>title</h2>");
  });

  it("renders emph", () => {
    const node: DjotNode = {
      tag: "emph",
      children: [{ tag: "str", text: "emphasis" }]
    };

    expect(toHtml(node)).toBe("<em>emphasis</em>");
  });

  it("renders strong", () => {
    const node: DjotNode = {
      tag: "strong",
      children: [{ tag: "str", text: "strong" }]
    };

    expect(toHtml(node)).toBe("<strong>strong</strong>");
  });

  it("renders mark", () => {
    const node: DjotNode = {
      tag: "mark",
      children: [{ tag: "str", text: "hi" }]
    };

    expect(toHtml(node)).toBe("<mark>hi</mark>");
  });

  it("renders highlighted", () => {
    const node: DjotNode = {
      tag: "highlighted",
      children: [{ tag: "str", text: "hi" }]
    };

    expect(toHtml(node)).toBe("<mark>hi</mark>");
  });

  it("renders superscript", () => {
    const node: DjotNode = {
      tag: "superscript",
      children: [{ tag: "str", text: "2" }]
    };

    expect(toHtml(node)).toBe("<sup>2</sup>");
  });

  it("renders supe", () => {
    const node: DjotNode = {
      tag: "supe",
      children: [{ tag: "str", text: "2" }]
    };

    expect(toHtml(node)).toBe("<sup>2</sup>");
  });

  it("renders subscript", () => {
    const node: DjotNode = {
      tag: "subscript",
      children: [{ tag: "str", text: "2" }]
    };

    expect(toHtml(node)).toBe("<sub>2</sub>");
  });

  it("renders insert", () => {
    const node: DjotNode = {
      tag: "insert",
      children: [{ tag: "str", text: "nice" }]
    };

    expect(toHtml(node)).toBe("<ins>nice</ins>");
  });

  it("renders delete", () => {
    const node: DjotNode = {
      tag: "delete",
      children: [{ tag: "str", text: "mean" }]
    };

    expect(toHtml(node)).toBe("<del>mean</del>");
  });

  it("renders footnote references and endnotes from doc", () => {
    const node: DjotNode = {
      tag: "doc",
      footnotes: {
        foo: {
          tag: "footnote",
          label: "foo",
          children: [{ tag: "para", children: [{ tag: "str", text: "And here is the note." }] }]
        }
      },
      children: [
        {
          tag: "para",
          children: [
            { tag: "str", text: "Here is the reference." },
            { tag: "footnote_reference", text: "foo" }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe(
      '<p>Here is the reference.<a href="#fn1" id="fnref1" role="doc-noteref"><sup>1</sup></a></p><section role="doc-endnotes"><hr/><ol><li id="fn1"><p>And here is the note.<a href="#fnref1" role="doc-backlink">↩︎</a></p></li></ol></section>'
    );
  });

  it("reuses footnote number and adds unique ref ids", () => {
    const node: DjotNode = {
      tag: "doc",
      footnotes: {
        foo: {
          tag: "footnote",
          label: "foo",
          children: [{ tag: "para", children: [{ tag: "str", text: "Note text" }] }]
        }
      },
      children: [
        {
          tag: "para",
          children: [
            { tag: "footnote_reference", text: "foo" },
            { tag: "str", text: " and " },
            { tag: "footnote_reference", text: "foo" }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe(
      '<p><a href="#fn1" id="fnref1" role="doc-noteref"><sup>1</sup></a> and <a href="#fn1" id="fnref1-2" role="doc-noteref"><sup>1</sup></a></p><section role="doc-endnotes"><hr/><ol><li id="fn1"><p>Note text<a href="#fnref1" role="doc-backlink">↩︎</a></p></li></ol></section>'
    );
  });

  it("renders double_quoted", () => {
    const node: DjotNode = {
      tag: "double_quoted",
      children: [{ tag: "str", text: "Hello" }]
    };

    expect(toHtml(node)).toBe("\u201cHello\u201d");
  });

  it("renders single_quoted", () => {
    const node: DjotNode = {
      tag: "single_quoted",
      children: [{ tag: "str", text: "Shelob" }]
    };

    expect(toHtml(node)).toBe("\u2018Shelob\u2019");
  });

  it("renders nested smart quotes in a paragraph", () => {
    const node: DjotNode = {
      tag: "para",
      children: [
        { tag: "double_quoted", children: [{ tag: "str", text: "Hello," }] },
        { tag: "str", text: " said the spider." },
        { tag: "soft_break" },
        {
          tag: "double_quoted",
          children: [
            { tag: "single_quoted", children: [{ tag: "str", text: "Shelob" }] },
            { tag: "str", text: " is my name." }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe(
      `<p>\u201cHello,\u201d said the spider.\n\u201c\u2018Shelob\u2019 is my name.\u201d</p>`
    );
  });

  it("renders smart_punctuation", () => {
    const node: DjotNode = {
      tag: "para",
      children: [
        { tag: "str", text: "57" },
        { tag: "smart_punctuation", type: "em_dash", text: "---" },
        { tag: "str", text: "33 oxen" },
        { tag: "smart_punctuation", type: "en_dash", text: "--" },
        { tag: "str", text: "and no sheep" },
        { tag: "smart_punctuation", type: "ellipses", text: "..." }
      ]
    };

    expect(toHtml(node)).toBe("<p>57\u201433 oxen\u2013and no sheep\u2026</p>");
  });

  it("renders inline_math", () => {
    const node: DjotNode = {
      tag: "inline_math",
      text: "e=mc^2"
    };

    expect(toHtml(node)).toBe('<span class="math inline">\\(e=mc^2\\)</span>');
  });

  it("renders display_math", () => {
    const node: DjotNode = {
      tag: "display_math",
      text: " x^n + y^n = z^n "
    };

    expect(toHtml(node)).toBe('<span class="math display">\\[ x^n + y^n = z^n \\]</span>');
  });

  it("renders inline and display math in a paragraph", () => {
    const node: DjotNode = {
      tag: "para",
      children: [
        { tag: "str", text: "Einstein derived " },
        { tag: "inline_math", text: "e=mc^2" },
        { tag: "str", text: "." },
        { tag: "soft_break" },
        { tag: "str", text: "Pythagoras proved" },
        { tag: "soft_break" },
        { tag: "display_math", text: " x^n + y^n = z^n " }
      ]
    };

    expect(toHtml(node)).toBe(
      '<p>Einstein derived <span class="math inline">\\(e=mc^2\\)</span>.\nPythagoras proved\n<span class="math display">\\[ x^n + y^n = z^n \\]</span></p>'
    );
  });

  it("renders insert and delete in a paragraph", () => {
    const node: DjotNode = {
      tag: "para",
      children: [
        { tag: "str", text: "My boss is " },
        { tag: "delete", children: [{ tag: "str", text: "mean" }] },
        { tag: "insert", children: [{ tag: "str", text: "nice" }] },
        { tag: "str", text: "." }
      ]
    };

    expect(toHtml(node)).toBe("<p>My boss is <del>mean</del><ins>nice</ins>.</p>");
  });

  it("renders span with attributes", () => {
    const node: DjotNode = {
      tag: "span",
      attributes: { class: "note", id: "greeting" },
      children: [{ tag: "str", text: "hello" }]
    };

    expect(toHtml(node)).toBe('<span class="note" id="greeting">hello</span>');
  });

  it("renders code", () => {
    const node: DjotNode = {
      tag: "code",
      text: "x < y"
    };

    expect(toHtml(node)).toBe("<code>x &lt; y</code>");
  });

  it("renders verbatim", () => {
    const node: DjotNode = {
      tag: "verbatim",
      text: "x < y"
    };

    expect(toHtml(node)).toBe("<code>x &lt; y</code>");
  });

  it("renders code_block", () => {
    const node: DjotNode = {
      tag: "code_block",
      lang: "ts",
      text: "const x = 1;"
    };

    expect(toHtml(node)).toBe('<pre><code class="language-ts">const x = 1;</code></pre>');
  });

  it("renders raw_block html as react nodes", () => {
    const node: DjotNode = {
      tag: "raw_block",
      format: "html",
      text: `<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
`
    };

    const html = toHtml(node);
    expect(html).toContain('<video width="320" height="240" controls="">');
    expect(html).toContain('<source src="movie.mp4" type="video/mp4"/>');
    expect(html).toContain('<source src="movie.ogg" type="video/ogg"/>');
    expect(html).toContain("Your browser does not support the video tag.");
    expect(html).toContain("</video>");
  });

  it("drops raw_block output for non-html format by default", () => {
    const node: DjotNode = {
      tag: "raw_block",
      format: "latex",
      text: "\\begin{equation}x=1\\end{equation}"
    };

    expect(toHtml(node)).toBe("");
  });

  it("renders raw_inline html as react nodes", () => {
    const node: DjotNode = {
      tag: "para",
      children: [
        { tag: "str", text: "Before " },
        { tag: "raw_inline", format: "html", text: "<span>ok</span>" },
        { tag: "str", text: " after" }
      ]
    };

    expect(toHtml(node)).toBe("<p>Before <span>ok</span> after</p>");
  });

  it("uses raw_block override when provided", () => {
    const node: DjotNode = {
      tag: "raw_block",
      format: "latex",
      text: "\\alpha"
    };

    const components: DjotComponents = {
      raw_block: ({ format, value }) => <pre data-format={format}>{value}</pre>
    };

    expect(toHtml(node, components)).toBe('<pre data-format="latex">\\alpha</pre>');
  });

  it("uses span override", () => {
    const node: DjotNode = {
      tag: "span",
      children: [{ tag: "str", text: "custom" }]
    };

    const components: DjotComponents = {
      span: ({ children }) => <em data-kind="span">{children}</em>
    };

    expect(toHtml(node, components)).toBe('<em data-kind="span">custom</em>');
  });

  it("renders symb literally by default", () => {
    const node: DjotNode = {
      tag: "symb",
      alias: "smile"
    };

    expect(toHtml(node)).toBe(":smile:");
  });

  it("uses symb override", () => {
    const node: DjotNode = {
      tag: "symb",
      alias: "smile"
    };

    const components: DjotComponents = {
      symb: ({ alias }) => <span data-kind="symb">{alias === "smile" ? "😄" : `:${alias}:`}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="symb">😄</span>');
  });

  it("renders url autolink", () => {
    const node: DjotNode = {
      tag: "url",
      text: "https://pandoc.org/lua-filters"
    };

    expect(toHtml(node)).toBe(
      '<a href="https://pandoc.org/lua-filters">https://pandoc.org/lua-filters</a>'
    );
  });

  it("renders email autolink", () => {
    const node: DjotNode = {
      tag: "email",
      text: "me@example.com"
    };

    expect(toHtml(node)).toBe('<a href="mailto:me@example.com">me@example.com</a>');
  });

  it("uses url override", () => {
    const node: DjotNode = {
      tag: "url",
      text: "https://example.com"
    };

    const components: DjotComponents = {
      url: ({ children }) => <span data-kind="url">{children}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="url">https://example.com</span>');
  });

  it("renders link", () => {
    const node: DjotNode = {
      tag: "link",
      destination: "https://example.com",
      children: [{ tag: "str", text: "example" }]
    };

    expect(toHtml(node)).toBe('<a href="https://example.com">example</a>');
  });

  it("resolves reference-style link destination from doc references", () => {
    const node: DjotNode = {
      tag: "doc",
      references: {
        bar: { tag: "reference", label: "bar", destination: "https://example.com" }
      },
      children: [
        {
          tag: "para",
          children: [{ tag: "link", reference: "bar", children: [{ tag: "str", text: "example" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe('<p><a href="https://example.com">example</a></p>');
  });

  it("resolves reference-style link destination from doc autoReferences", () => {
    const node: DjotNode = {
      tag: "doc",
      autoReferences: {
        sec: { tag: "reference", label: "sec", destination: "#Section" }
      },
      children: [
        {
          tag: "para",
          children: [{ tag: "link", reference: "sec", children: [{ tag: "str", text: "Section" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe('<p><a href="#Section">Section</a></p>');
  });

  it("renders image", () => {
    const node: DjotNode = {
      tag: "image",
      destination: "/logo.png",
      children: [{ tag: "str", text: "logo" }]
    };

    expect(toHtml(node)).toBe('<img alt="logo" src="/logo.png"/>');
  });

  it("resolves reference-style image destination from doc references", () => {
    const node: DjotNode = {
      tag: "doc",
      references: {
        logo: { tag: "reference", label: "logo", destination: "/logo.png" }
      },
      children: [
        {
          tag: "para",
          children: [{ tag: "image", reference: "logo", children: [{ tag: "str", text: "logo" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe('<p><img alt="logo" src="/logo.png"/></p>');
  });

  it("renders bullet_list", () => {
    const node: DjotNode = {
      tag: "bullet_list",
      children: [
        { tag: "list_item", children: [{ tag: "str", text: "one" }] },
        { tag: "list_item", children: [{ tag: "str", text: "two" }] }
      ]
    };

    expect(toHtml(node)).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("renders ordered_list", () => {
    const node: DjotNode = {
      tag: "ordered_list",
      start: 3,
      children: [{ tag: "list_item", children: [{ tag: "str", text: "step" }] }]
    };

    expect(toHtml(node)).toBe('<ol start="3"><li>step</li></ol>');
  });

  it("renders ordered_list type for roman style", () => {
    const node: DjotNode = {
      tag: "ordered_list",
      style: "i)",
      start: 1,
      children: [{ tag: "list_item", children: [{ tag: "str", text: "step" }] }]
    };

    expect(toHtml(node)).toBe('<ol type="i"><li>step</li></ol>');
  });

  it("does not emit type for decimal ordered_list styles", () => {
    const node: DjotNode = {
      tag: "ordered_list",
      style: "(1)",
      start: 3,
      children: [{ tag: "list_item", children: [{ tag: "str", text: "step" }] }]
    };

    expect(toHtml(node)).toBe('<ol start="3"><li>step</li></ol>');
  });

  it("unwraps single para child in tight bullet_list default rendering", () => {
    const node: DjotNode = {
      tag: "bullet_list",
      tight: true,
      children: [
        {
          tag: "list_item",
          children: [{ tag: "para", children: [{ tag: "str", text: "one" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe("<ul><li>one</li></ul>");
  });

  it("keeps para wrapper in loose bullet_list default rendering", () => {
    const node: DjotNode = {
      tag: "bullet_list",
      tight: false,
      children: [
        {
          tag: "list_item",
          children: [{ tag: "para", children: [{ tag: "str", text: "one" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe("<ul><li><p>one</p></li></ul>");
  });

  it("unwraps single para child in tight ordered_list default rendering", () => {
    const node: DjotNode = {
      tag: "ordered_list",
      tight: true,
      children: [
        {
          tag: "list_item",
          children: [{ tag: "para", children: [{ tag: "str", text: "one" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe("<ol><li>one</li></ol>");
  });

  it("keeps para wrapper in loose ordered_list default rendering", () => {
    const node: DjotNode = {
      tag: "ordered_list",
      tight: false,
      children: [
        {
          tag: "list_item",
          children: [{ tag: "para", children: [{ tag: "str", text: "one" }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe("<ol><li><p>one</p></li></ol>");
  });

  it("renders list_item", () => {
    const node: DjotNode = {
      tag: "list_item",
      children: [{ tag: "str", text: "item" }]
    };

    expect(toHtml(node)).toBe("<li>item</li>");
  });

  it("renders definition_list", () => {
    const node: DjotNode = {
      tag: "definition_list",
      children: [
        {
          tag: "definition_list_item",
          children: [
            { tag: "term", children: [{ tag: "str", text: "orange" }] },
            {
              tag: "definition",
              children: [{ tag: "para", children: [{ tag: "str", text: "A citrus fruit." }] }]
            }
          ]
        }
      ]
    };

    expect(toHtml(node)).toBe("<dl><dt>orange</dt><dd><p>A citrus fruit.</p></dd></dl>");
  });

  it("renders definition_list_item without extra wrapper", () => {
    const node: DjotNode = {
      tag: "definition_list_item",
      children: [
        { tag: "term", children: [{ tag: "str", text: "orange" }] },
        {
          tag: "definition",
          children: [{ tag: "para", children: [{ tag: "str", text: "A citrus fruit." }] }]
        }
      ]
    };

    expect(toHtml(node)).toBe("<dt>orange</dt><dd><p>A citrus fruit.</p></dd>");
  });

  it("renders term", () => {
    const node: DjotNode = {
      tag: "term",
      children: [{ tag: "str", text: "orange" }]
    };

    expect(toHtml(node)).toBe("<dt>orange</dt>");
  });

  it("renders definition", () => {
    const node: DjotNode = {
      tag: "definition",
      children: [{ tag: "para", children: [{ tag: "str", text: "A citrus fruit." }] }]
    };

    expect(toHtml(node)).toBe("<dd><p>A citrus fruit.</p></dd>");
  });

  it("uses definition_list_item override", () => {
    const node: DjotNode = {
      tag: "definition_list_item",
      children: [{ tag: "term", children: [{ tag: "str", text: "orange" }] }]
    };
    const components: DjotComponents = {
      definition_list_item: ({ children }) => <div data-kind="definition-item">{children}</div>
    };

    expect(toHtml(node, components)).toBe('<div data-kind="definition-item"><dt>orange</dt></div>');
  });

  it("renders task_list with unchecked items", () => {
    const node: DjotNode = {
      tag: "task_list",
      tight: true,
      children: [
        {
          tag: "task_list_item",
          checkbox: "unchecked",
          children: [{ tag: "para", children: [{ tag: "str", text: "todo" }] }]
        }
      ]
    };
    expect(toHtml(node)).toBe('<ul class="task-list"><li><input type="checkbox" disabled=""/>todo</li></ul>');
  });

  it("renders task_list_item unchecked", () => {
    const node: DjotNode = {
      tag: "task_list_item",
      checkbox: "unchecked",
      children: [{ tag: "str", text: "buy milk" }]
    };
    expect(toHtml(node)).toBe('<li><input type="checkbox" disabled=""/>buy milk</li>');
  });

  it("renders task_list_item checked", () => {
    const node: DjotNode = {
      tag: "task_list_item",
      checkbox: "checked",
      children: [{ tag: "str", text: "done" }]
    };
    expect(toHtml(node)).toBe('<li><input type="checkbox" disabled="" checked=""/>done</li>');
  });

  it("unwraps single para child in tight task_list default rendering", () => {
    const node: DjotNode = {
      tag: "task_list",
      tight: true,
      children: [
        {
          tag: "task_list_item",
          checkbox: "unchecked",
          children: [{ tag: "para", children: [{ tag: "str", text: "buy milk" }] }]
        }
      ]
    };
    expect(toHtml(node)).toBe('<ul class="task-list"><li><input type="checkbox" disabled=""/>buy milk</li></ul>');
  });

  it("keeps para wrapper in loose task_list default rendering", () => {
    const node: DjotNode = {
      tag: "task_list",
      tight: false,
      children: [
        {
          tag: "task_list_item",
          checkbox: "unchecked",
          children: [{ tag: "para", children: [{ tag: "str", text: "buy milk" }] }]
        }
      ]
    };
    expect(toHtml(node)).toBe('<ul class="task-list"><li><input type="checkbox" disabled=""/><p>buy milk</p></li></ul>');
  });

  it("uses task_list_item override", () => {
    const node: DjotNode = {
      tag: "task_list_item",
      checkbox: "checked",
      children: [{ tag: "str", text: "done" }]
    };
    const components: DjotComponents = {
      task_list_item: ({ checkbox, children }) => (
        <li data-checked={checkbox === "checked"}>{children}</li>
      )
    };
    expect(toHtml(node, components)).toBe('<li data-checked="true">done</li>');
  });

  it("renders blockquote", () => {
    const node: DjotNode = {
      tag: "blockquote",
      children: [{ tag: "para", children: [{ tag: "str", text: "quote" }] }]
    };

    expect(toHtml(node)).toBe("<blockquote><p>quote</p></blockquote>");
  });

  it("renders block_quote", () => {
    const node: DjotNode = {
      tag: "block_quote",
      children: [{ tag: "para", children: [{ tag: "str", text: "quote" }] }]
    };

    expect(toHtml(node)).toBe("<blockquote><p>quote</p></blockquote>");
  });

  it("renders thematic_break", () => {
    const node: DjotNode = {
      tag: "thematic_break"
    };

    expect(toHtml(node)).toBe("<hr/>");
  });

  it("renders str", () => {
    const node: DjotNode = {
      tag: "str",
      text: "text"
    };

    expect(renderToStaticMarkup(<div>{renderNode(node)}</div>)).toBe("<div>text</div>");
  });

  it("renders non_breaking_space", () => {
    const node: DjotNode = {
      tag: "non_breaking_space"
    };

    expect(renderToStaticMarkup(<div>{renderNode(node)}</div>)).toBe("<div>\u00a0</div>");
  });

  it("renders softbreak and soft_break", () => {
    const softBreakNode: DjotNode = { tag: "softbreak" };
    const softBreakUnderscoreNode: DjotNode = { tag: "soft_break" };

    expect(renderToStaticMarkup(<div>{renderNode(softBreakNode)}</div>)).toBe("<div>\n</div>");
    expect(renderToStaticMarkup(<div>{renderNode(softBreakUnderscoreNode)}</div>)).toBe(
      "<div>\n</div>"
    );
  });

  it("renders hardbreak and hard_break", () => {
    const hardBreakNode: DjotNode = { tag: "hardbreak" };
    const hardBreakUnderscoreNode: DjotNode = { tag: "hard_break" };

    expect(renderToStaticMarkup(<div>{renderNode(hardBreakNode)}</div>)).toBe("<div><br/></div>");
    expect(renderToStaticMarkup(<div>{renderNode(hardBreakUnderscoreNode)}</div>)).toBe(
      "<div><br/></div>"
    );
  });

  it("uses component overrides", () => {
    const node: DjotNode = {
      tag: "para",
      children: [{ tag: "str", text: "custom" }]
    };

    const components: DjotComponents = {
      para: ({ children }) => <div data-node="para">{children}</div>
    };

    expect(toHtml(node, components)).toBe('<div data-node="para">custom</div>');
  });

  it("uses non_breaking_space override", () => {
    const node: DjotNode = {
      tag: "non_breaking_space"
    };

    const components: DjotComponents = {
      non_breaking_space: () => <span data-kind="nbsp">NBSP</span>
    };

    expect(renderToStaticMarkup(<div>{renderNode(node, { components })}</div>)).toBe(
      '<div><span data-kind="nbsp">NBSP</span></div>'
    );
  });

  it("uses div override", () => {
    const node: DjotNode = {
      tag: "div",
      attributes: { class: "warning" },
      children: [{ tag: "para", children: [{ tag: "str", text: "warn" }] }]
    };

    const components: DjotComponents = {
      div: ({ children }) => <aside data-kind="div">{children}</aside>
    };

    expect(toHtml(node, components)).toBe('<aside data-kind="div"><p>warn</p></aside>');
  });

  it("uses table cell override", () => {
    const node: DjotNode = {
      tag: "table",
      children: [
        { tag: "caption", children: [] },
        {
          tag: "row",
          head: false,
          children: [
            {
              tag: "cell",
              head: false,
              align: "right",
              children: [{ tag: "str", text: "2" }]
            }
          ]
        }
      ]
    };

    const components: DjotComponents = {
      cell: ({ align, children }) => <td data-align={align}>{children}</td>
    };

    expect(toHtml(node, components)).toBe(
      '<table><tbody><tr><td data-align="right">2</td></tr></tbody></table>'
    );
  });

  it("uses code override for verbatim by default", () => {
    const node: DjotNode = {
      tag: "verbatim",
      text: "inline"
    };

    const components: DjotComponents = {
      code: ({ value }) => <span data-kind="code">{value}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="code">inline</span>');
  });

  it("uses blockquote override for block_quote by default", () => {
    const node: DjotNode = {
      tag: "block_quote",
      children: [{ tag: "para", children: [{ tag: "str", text: "q" }] }]
    };

    const components: DjotComponents = {
      blockquote: ({ children }) => <aside data-kind="quote">{children}</aside>
    };

    expect(toHtml(node, components)).toBe('<aside data-kind="quote"><p>q</p></aside>');
  });

  it("uses mark override for highlighted by default", () => {
    const node: DjotNode = {
      tag: "highlighted",
      children: [{ tag: "str", text: "hot" }]
    };

    const components: DjotComponents = {
      mark: ({ children }) => <span data-kind="mark">{children}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="mark">hot</span>');
  });

  it("uses superscript override for supe by default", () => {
    const node: DjotNode = {
      tag: "supe",
      children: [{ tag: "str", text: "2" }]
    };

    const components: DjotComponents = {
      superscript: ({ children }) => <span data-kind="sup">{children}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="sup">2</span>');
  });

  it("uses insert override", () => {
    const node: DjotNode = {
      tag: "insert",
      children: [{ tag: "str", text: "nice" }]
    };

    const components: DjotComponents = {
      insert: ({ children }) => <span data-kind="insert">{children}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="insert">nice</span>');
  });

  it("uses delete override", () => {
    const node: DjotNode = {
      tag: "delete",
      children: [{ tag: "str", text: "mean" }]
    };

    const components: DjotComponents = {
      delete: ({ children }) => <span data-kind="delete">{children}</span>
    };

    expect(toHtml(node, components)).toBe('<span data-kind="delete">mean</span>');
  });

  it("uses inline_math override", () => {
    const node: DjotNode = {
      tag: "inline_math",
      text: "e=mc^2"
    };

    const components: DjotComponents = {
      inline_math: ({ value }) => <code data-kind="inline-math">{value}</code>
    };

    expect(toHtml(node, components)).toBe('<code data-kind="inline-math">e=mc^2</code>');
  });

  it("uses display_math override", () => {
    const node: DjotNode = {
      tag: "display_math",
      text: "x^n + y^n = z^n"
    };

    const components: DjotComponents = {
      display_math: ({ value }) => <code data-kind="display-math">{value}</code>
    };

    expect(toHtml(node, components)).toBe(
      '<code data-kind="display-math">x^n + y^n = z^n</code>'
    );
  });

  it("uses footnote overrides", () => {
    const node: DjotNode = {
      tag: "doc",
      footnotes: {
        foo: {
          tag: "footnote",
          label: "foo",
          children: [{ tag: "para", children: [{ tag: "str", text: "Note text" }] }]
        }
      },
      children: [
        {
          tag: "para",
          children: [{ tag: "footnote_reference", text: "foo" }]
        }
      ]
    };

    const components: DjotComponents = {
      footnote_reference: ({ index }) => <span data-kind="fnref">{index}</span>,
      footnote: ({ children }) => <li data-kind="footnote">{children}</li>,
      endnotes: ({ children }) => <section data-kind="endnotes">{children}</section>
    };

    expect(toHtml(node, components)).toBe(
      '<p><span data-kind="fnref">1</span></p><section data-kind="endnotes"><hr/><ol><li data-kind="footnote"><p>Note text<a href="#fnref1" role="doc-backlink">↩︎</a></p></li></ol></section>'
    );
  });

  it("uses smart_punctuation override", () => {
    const node: DjotNode = {
      tag: "smart_punctuation",
      type: "right_single_quote",
      text: "'"
    };

    const components: DjotComponents = {
      smart_punctuation: ({ kind, value }) => (
        <span data-kind={kind} data-value={value}>
          {value}
        </span>
      )
    };

    expect(toHtml(node, components)).toBe(
      '<span data-kind="right_single_quote" data-value="\u2019">\u2019</span>'
    );
  });

  it("uses single_quoted override for double_quoted by default", () => {
    const node: DjotNode = {
      tag: "double_quoted",
      children: [{ tag: "str", text: "Hello" }]
    };

    const components: DjotComponents = {
      single_quoted: ({ children }) => <span data-kind="quote">{children}</span>
    };

    expect(toHtml(node, components)).toBe(
      '<span data-kind="quote">\u201cHello\u201d</span>'
    );
  });
});
