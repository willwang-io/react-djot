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

    expect(toHtml(node)).toBe("<h1>title</h1><p>body</p>");
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

    expect(toHtml(node)).toBe("<table><tr><td>1</td><td>2</td></tr></table>");
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
      '<table><tr><th>fruit</th><th style="text-align:right">price</th></tr><tr><td>apple</td><td style="text-align:right">4</td></tr><tr><td>banana</td><td style="text-align:right">10</td></tr></table>'
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

  it("renders link", () => {
    const node: DjotNode = {
      tag: "link",
      destination: "https://example.com",
      children: [{ tag: "str", text: "example" }]
    };

    expect(toHtml(node)).toBe('<a href="https://example.com">example</a>');
  });

  it("renders image", () => {
    const node: DjotNode = {
      tag: "image",
      destination: "/logo.png",
      children: [{ tag: "str", text: "logo" }]
    };

    expect(toHtml(node)).toBe('<img alt="logo" src="/logo.png"/>');
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

  it("renders list_item", () => {
    const node: DjotNode = {
      tag: "list_item",
      children: [{ tag: "str", text: "item" }]
    };

    expect(toHtml(node)).toBe("<li>item</li>");
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

    expect(toHtml(node, components)).toBe('<table><tr><td data-align="right">2</td></tr></table>');
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
