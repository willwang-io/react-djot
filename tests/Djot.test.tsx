import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Djot, compileDjot } from "../src";
import type { DjotNode } from "../src";

describe("Djot", () => {
  it("renders from source string children", () => {
    const html = renderToStaticMarkup(<Djot>hello</Djot>);
    expect(html).toBe("<p>hello</p>");
  });

  it("returns null for empty source children", () => {
    const html = renderToStaticMarkup(<Djot>{""}</Djot>);
    expect(html).toBe("");
  });

  it("renders precompiled ast when ast prop is provided", () => {
    const ast: DjotNode = {
      tag: "doc",
      children: [{ tag: "para", children: [{ tag: "str", text: "from ast" }] }]
    };

    const html = renderToStaticMarkup(<Djot ast={ast} />);
    expect(html).toBe("<p>from ast</p>");
  });

  it("renders raw html blocks from djot source", () => {
    const source = `~~~=html
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
</video>
~~~`;

    const html = renderToStaticMarkup(<Djot>{source}</Djot>);
    expect(html).toContain('<video width="320" height="240" controls="">');
    expect(html).toContain('<source src="movie.mp4" type="video/mp4"/>');
    expect(html).toContain("</video>");
  });

  it("renders autolinks for url and email", () => {
    const source = `<https://pandoc.org/lua-filters>
<me@example.com>`;

    const html = renderToStaticMarkup(<Djot>{source}</Djot>);
    expect(html).toBe(
      '<p><a href="https://pandoc.org/lua-filters">https://pandoc.org/lua-filters</a>\n<a href="mailto:me@example.com">me@example.com</a></p>'
    );
  });

  it("renders symbol aliases literally by default", () => {
    const html = renderToStaticMarkup(<Djot>{":smile:"}</Djot>);
    expect(html).toBe("<p>:smile:</p>");
  });

  it("preserves paragraph wrappers for loose task lists", () => {
    const source = `- [ ] one

- [ ] two`;

    const html = renderToStaticMarkup(<Djot>{source}</Djot>);
    expect(html).toBe(
      '<ul class="task-list"><li><input type="checkbox" disabled=""/><p>one</p></li><li><input type="checkbox" disabled=""/><p>two</p></li></ul>'
    );
  });

  it("renders escaped space as non-breaking space", () => {
    const html = renderToStaticMarkup(<Djot>{"A\\ B"}</Djot>);
    expect(html).toBe("<p>A\u00a0B</p>");
  });

  it("renders definition list syntax", () => {
    const source = `: orange

  A citrus fruit.`;

    const html = renderToStaticMarkup(<Djot>{source}</Djot>);
    expect(html).toBe("<dl><dt>orange</dt><dd><p>A citrus fruit.</p></dd></dl>");
  });

});

describe("compileDjot", () => {
  it("returns the same ast reference for repeated source", () => {
    const first = compileDjot("alpha");
    const second = compileDjot("alpha");

    expect(second).toBe(first);
  });

  it("evicts the least recently used source when cache is full", () => {
    const first = compileDjot("seed");

    for (let index = 0; index < 100; index += 1) {
      compileDjot(`source-${index}`);
    }

    const again = compileDjot("seed");
    expect(again).not.toBe(first);
  });
});
