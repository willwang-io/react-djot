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

  it("renders code", () => {
    const node: DjotNode = {
      tag: "code",
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
});
