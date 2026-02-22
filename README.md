# react-djot

`react-djot` renders [Djot](https://djot.net/) into React elements with a
`react-markdown`-style API.

The design goal is familiarity: if you know `react-markdown`, you should feel
at home with `react-djot`.

## Features

- React 18+ support
- `components` override map for per-node rendering control
- No `dangerouslySetInnerHTML`
- React Server Component friendly main path (no hooks)
- TypeScript-first API

## Installation

```bash
npm install react-djot
```

Peer dependencies:

- `react`
- `react-dom`
- `@djot/djot`

## Quick Start

```tsx
import { Djot } from "react-djot";

export function Example() {
  return <Djot>{"# Hello\n\nThis is *Djot*."}</Djot>;
}
```

## API

### `<Djot />`

```tsx
import { Djot, compileDjot } from "react-djot";

<Djot
  children={"# Title"}
  components={
    {
      /* overrides */
    }
  }
/>;

const ast = compileDjot("# Precompiled");
<Djot ast={ast} />;
```

Props:

- `children?: string | null | undefined`
  - Djot source text to parse and render.
- `ast?: DjotNode`
  - Precompiled Djot AST to render directly (bypasses parsing).
- `components?: DjotComponents`
  - Optional map of node-tag keys to React components.

`children` and `ast` are mutually exclusive. Use one or the other.

### `components` overrides

The override pattern mirrors `react-markdown`: provide a component per node
type key.

```tsx
import { Djot } from "react-djot";
import type { DjotComponents } from "react-djot";

const components: DjotComponents = {
  para: ({ node, children, ...props }) => (
    <p className="lead" {...props}>
      {children}
    </p>
  ),
  heading: ({ level, node, children, ...props }) => {
    const Tag = `h${Math.min(Math.max(level, 1), 6)}` as const;
    return (
      <Tag {...props} data-level={level}>
        {children}
      </Tag>
    );
  },
  link: ({ node, href, children, ...props }) => (
    <a {...props} href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  )
};

export function Example() {
  return <Djot components={components}>{"## Custom\n\n[Go](https://example.com)"}</Djot>;
}
```

### Supported node keys (current core set)

- `doc`
- `section`
- `div`
- `table`
- `caption`
- `row`
- `cell`
- `para`
- `heading`
- `emph`
- `strong`
- `mark` and `highlighted`
- `superscript` and `supe`
- `subscript`
- `insert`
- `delete`
- `span`
- `footnote_reference`
- `footnote`
- `endnotes`
- `double_quoted`
- `single_quoted`
- `smart_punctuation`
- `symb`
- `inline_math`
- `display_math`
- `code`
- `verbatim`
- `code_block`
- `raw_block`
- `raw_inline`
- `url`
- `email`
- `link`
- `image`
- `bullet_list`
- `ordered_list`
- `list_item`
- `definition_list`
- `definition_list_item`
- `term`
- `definition`
- `task_list`
- `task_list_item`
- `blockquote` and `block_quote`
- `thematic_break`
- `str`
- `non_breaking_space`
- `soft_break` and `softbreak`
- `hard_break` and `hardbreak`

## Rendering Guarantees

- Parses Djot via `@djot/djot` `parse()`
- Walks the AST recursively and creates React elements directly
- Does not use `dangerouslySetInnerHTML`

## Raw HTML

Djot raw blocks and raw inlines are supported:

- Block: `~~~=html ... ~~~`
- Inline: `` `...`{=html} ``

Only `html` format is rendered by default. Other formats are ignored unless you
provide a `components.raw_block` or `components.raw_inline` override.

## Autolinks

Autolink nodes are supported:

- `<https://pandoc.org/lua-filters>` -> `<a href="https://pandoc.org/lua-filters">...`
- `<me@example.com>` -> `<a href="mailto:me@example.com">...`

## Reference Links and Images

Reference-style links and images resolve against document references:

```djot
[foo][bar]
![logo][img]

[bar]: https://example.com
[img]: /logo.png
```

## Symbols

Djot symbols (`:alias:`) render literally by default. You can provide a
`components.symb` override to map aliases to emojis or any custom output.

## Task Lists

A bullet list item starting with `[ ]` (unchecked) or `[x]`/`[X]` (checked)
is a task list item:

```djot
- [ ] unchecked item
- [x] checked item
```

By default, task list items render as `<li>` elements with a disabled
`<input type="checkbox">` prepended to the content. Use the `task_list` and
`task_list_item` override keys to customise this rendering:

```tsx
const components: DjotComponents = {
  task_list_item: ({ checkbox, children }) => (
    <li data-checked={checkbox === "checked"}>{children}</li>
  )
};
```

Tight task lists (no blank lines between items) render item text inline with
the checkbox. Loose task lists preserve paragraph wrappers (`<p>...</p>`)
inside each item.

Styling note: browsers apply default list markers to `<ul>/<li>`. To match
Djot playground output (checkboxes without bullet dots), reset task-list
styles in your app CSS:

```css
.task-list {
  list-style: none;
  padding-left: 0;
}

.task-list li {
  list-style: none;
}

.task-list input[type="checkbox"] {
  margin-right: 0.45rem;
}
```

## Definition Lists

Definition list items are supported and render to semantic `<dl>/<dt>/<dd>`
elements:

```djot
: orange

  A citrus fruit.
```

## Non-breaking Spaces

An escaped space (`\ `) is parsed as `non_breaking_space` and renders as a
non-breaking space character.

## React Server Components

`<Djot />` has no hooks in the main render path, so it can be used in Server
Components.

## Development

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Demo App

A React + Vite demo app lives in `examples/react-djot-demo`.

```bash
npm run build
cd examples/react-djot-demo
npm install
npm run dev
```

## License

MIT
