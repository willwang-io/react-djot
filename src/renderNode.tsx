import { cloneElement, createElement, Fragment, isValidElement } from "react";
import type React from "react";
import type {
  DjotBaseNode,
  DjotBlockQuoteNode,
  DjotBlockquoteNode,
  DjotCaptionNode,
  DjotCellNode,
  DjotCodeBlockNode,
  DjotCodeNode,
  DjotComponentPropsMap,
  DjotComponents,
  DjotDeleteNode,
  DjotDivNode,
  DjotDoubleQuotedNode,
  DjotDisplayMathNode,
  DjotDocNode,
  DjotEmailNode,
  DjotFootnoteReferenceNode,
  DjotHardBreakNode,
  DjotHeadingNode,
  DjotHighlightedNode,
  DjotImageNode,
  DjotInlineMathNode,
  DjotInsertNode,
  DjotLinkNode,
  DjotMarkNode,
  DjotNonBreakingSpaceNode,
  DjotNode,
  DjotOrderedListNode,
  DjotParentNode,
  DjotRawBlockNode,
  DjotRawInlineNode,
  DjotRowNode,
  DjotSectionNode,
  DjotSoftBreakNode,
  DjotSmartPunctuationNode,
  DjotSmartPunctuationType,
  DjotSingleQuotedNode,
  DjotStrNode,
  DjotSubscriptNode,
  DjotSymbNode,
  DjotSuperscriptNode,
  DjotSupeNode,
  DjotTableAlignment,
  DjotTableNode,
  DjotUrlNode,
  DjotVerbatimNode
} from "./types";

export interface RenderNodeOptions {
  components?: DjotComponents | undefined;
  footnoteState?: FootnoteState | undefined;
  key?: React.Key;
}

type ComponentKey = keyof DjotComponentPropsMap;

interface FootnoteState {
  firstRefIdByLabel: Map<string, string>;
  indexByLabel: Map<string, number>;
  order: string[];
  refCountByLabel: Map<string, number>;
}

function isParentNode(node: DjotBaseNode): node is DjotParentNode {
  return Array.isArray((node as DjotParentNode).children);
}

function isSoftBreakNode(node: DjotNode): node is DjotSoftBreakNode {
  return node.tag === "soft_break" || node.tag === "softbreak";
}

function isHardBreakNode(node: DjotNode): node is DjotHardBreakNode {
  return node.tag === "hard_break" || node.tag === "hardbreak";
}

function pickComponent(
  components: DjotComponents | undefined,
  primary: ComponentKey,
  alias?: ComponentKey
): React.ElementType | undefined {
  if (!components) {
    return undefined;
  }

  return (components[primary] ?? (alias ? components[alias] : undefined)) as
    | React.ElementType
    | undefined;
}

function renderChildren(
  children: DjotNode[],
  components?: DjotComponents,
  footnoteState?: FootnoteState
): React.ReactNode[] {
  return children.map((child, index) =>
    renderNode(child, {
      components,
      footnoteState,
      key: index
    })
  );
}

function collectFootnoteReferences(nodes: DjotNode[], indexByLabel: Map<string, number>, order: string[]): void {
  for (const node of nodes) {
    if (node.tag === "footnote_reference") {
      const label = node.text;
      if (!indexByLabel.has(label)) {
        const index = order.length + 1;
        indexByLabel.set(label, index);
        order.push(label);
      }
      continue;
    }

    if (isParentNode(node)) {
      collectFootnoteReferences(node.children, indexByLabel, order);
    }
  }
}

function createFootnoteState(node: DjotDocNode): FootnoteState {
  const indexByLabel = new Map<string, number>();
  const order: string[] = [];

  collectFootnoteReferences(node.children, indexByLabel, order);

  return {
    firstRefIdByLabel: new Map<string, string>(),
    indexByLabel,
    order,
    refCountByLabel: new Map<string, number>()
  };
}

function ensureFootnoteIndex(label: string, footnoteState: FootnoteState): number {
  const existing = footnoteState.indexByLabel.get(label);
  if (existing) {
    return existing;
  }

  const index = footnoteState.order.length + 1;
  footnoteState.indexByLabel.set(label, index);
  footnoteState.order.push(label);
  return index;
}

function appendBacklink(
  nodes: React.ReactNode[],
  backlink: React.ReactNode
): React.ReactNode[] {
  if (nodes.length === 0) {
    return [backlink];
  }

  const next = nodes.slice();
  const lastIndex = next.length - 1;
  const last = next[lastIndex];

  if (isValidElement<{ children?: React.ReactNode }>(last)) {
    next[lastIndex] = cloneElement(last, undefined, last.props.children, backlink);
    return next;
  }

  next.push(backlink);
  return next;
}

function toSmartPunctuation(type: DjotSmartPunctuationType, fallback: string): string {
  switch (type) {
    case "left_double_quote":
      return "\u201c";
    case "right_double_quote":
      return "\u201d";
    case "left_single_quote":
      return "\u2018";
    case "right_single_quote":
      return "\u2019";
    case "em_dash":
      return "\u2014";
    case "en_dash":
      return "\u2013";
    case "ellipses":
      return "\u2026";
    default:
      return fallback;
  }
}

function toAltText(nodes: DjotNode[]): string {
  let output = "";

  for (const node of nodes) {
    switch (node.tag) {
      case "str":
      case "code":
      case "verbatim":
      case "inline_math":
      case "display_math":
      case "code_block":
      case "raw_block":
      case "raw_inline":
      case "symb":
      case "url":
      case "email":
        output += node.tag === "symb" ? `:${node.alias}:` : node.text;
        break;
      case "non_breaking_space":
        output += "\u00a0";
        break;
      case "smart_punctuation":
        output += toSmartPunctuation(node.type, node.text);
        break;
      case "double_quoted":
        output += `\u201c${toAltText(node.children)}\u201d`;
        break;
      case "single_quoted":
        output += `\u2018${toAltText(node.children)}\u2019`;
        break;
      case "soft_break":
      case "softbreak":
        output += " ";
        break;
      case "hard_break":
      case "hardbreak":
        output += "\n";
        break;
      default:
        if (isParentNode(node)) {
          output += toAltText(node.children);
        }
        break;
    }
  }

  return output.trim();
}

function clampHeadingLevel(level: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (level <= 1) {
    return 1;
  }

  if (level >= 6) {
    return 6;
  }

  return level as 1 | 2 | 3 | 4 | 5 | 6;
}

function withKey<T extends Record<string, unknown>>(props: T, key?: React.Key): T & { key?: React.Key } {
  if (key === undefined) {
    return props;
  }

  return {
    ...props,
    key
  };
}

function toDomPropsFromAttributes(attributes: Record<string, string> | undefined): Record<string, unknown> {
  if (!attributes) {
    return {};
  }

  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (name === "class") {
      props.className = value;
    } else {
      props[name] = value;
    }
  }

  return props;
}

function textAlignForCell(align: DjotTableAlignment): React.CSSProperties["textAlign"] | undefined {
  if (align === "left") {
    return "left";
  }

  if (align === "right") {
    return "right";
  }

  if (align === "center") {
    return "center";
  }

  return undefined;
}

interface RawHtmlAttribute {
  name: string;
  value: string;
}

interface RawHtmlElementNode {
  attributes: RawHtmlAttribute[];
  children: RawHtmlNode[];
  tagName: string;
  type: "element";
}

interface RawHtmlTextNode {
  text: string;
  type: "text";
}

type RawHtmlNode = RawHtmlElementNode | RawHtmlTextNode;

const RAW_HTML_ATTR_PATTERN =
  /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const RAW_HTML_TOKEN_PATTERN = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+|</g;

const RAW_HTML_BLOCKED_TAGS = new Set([
  "base",
  "embed",
  "form",
  "iframe",
  "meta",
  "object",
  "script"
]);

const RAW_HTML_BOOLEAN_ATTRS = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "hidden",
  "loop",
  "multiple",
  "muted",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);

const RAW_HTML_UNSAFE_PROTOCOL = /^\s*(?:javascript:|vbscript:|data:)/i;
const RAW_HTML_URL_ATTRS = new Set([
  "action",
  "formaction",
  "href",
  "poster",
  "src",
  "xlink:href"
]);

const RAW_HTML_VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      if (!Number.isNaN(codePoint)) {
        return String.fromCodePoint(codePoint);
      }
      return _match;
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      if (!Number.isNaN(codePoint)) {
        return String.fromCodePoint(codePoint);
      }
      return _match;
    }

    switch (entity) {
      case "amp":
        return "&";
      case "apos":
        return "'";
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "nbsp":
        return "\u00a0";
      case "quot":
        return '"';
      default:
        return _match;
    }
  });
}

function parseRawHtmlAttributes(source: string): RawHtmlAttribute[] {
  const attributes: RawHtmlAttribute[] = [];

  for (const match of source.matchAll(RAW_HTML_ATTR_PATTERN)) {
    const name = match[1]?.toLowerCase();
    if (!name) {
      continue;
    }

    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    const value = decodeHtmlEntities(rawValue);
    attributes.push({ name, value });
  }

  return attributes;
}

function parseRawHtmlFragment(source: string): RawHtmlNode[] {
  const root: RawHtmlElementNode = {
    attributes: [],
    children: [],
    tagName: "#root",
    type: "element"
  };

  const stack: RawHtmlElementNode[] = [root];

  for (const match of source.matchAll(RAW_HTML_TOKEN_PATTERN)) {
    const token = match[0];

    if (token.startsWith("<!--")) {
      continue;
    }

    if (token === "<") {
      stack[stack.length - 1]?.children.push({ text: "<", type: "text" });
      continue;
    }

    const closingTag = /^<\/\s*([A-Za-z][\w:-]*)\s*>$/.exec(token);
    if (closingTag) {
      const closingTagName = closingTag[1];
      if (!closingTagName) {
        continue;
      }

      const tagName = closingTagName.toLowerCase();

      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index]?.tagName === tagName) {
          stack.length = index;
          break;
        }
      }

      continue;
    }

    const openingTag = /^<\s*([A-Za-z][\w:-]*)([\s\S]*?)>$/.exec(token);
    if (openingTag) {
      const openingTagName = openingTag[1];
      if (!openingTagName) {
        continue;
      }

      const tagName = openingTagName.toLowerCase();
      const rawAttributes = openingTag[2] ?? "";
      const selfClosing = /\/\s*$/.test(rawAttributes) || RAW_HTML_VOID_TAGS.has(tagName);
      const attrSource = selfClosing ? rawAttributes.replace(/\/\s*$/, "") : rawAttributes;

      const element: RawHtmlElementNode = {
        attributes: parseRawHtmlAttributes(attrSource),
        children: [],
        tagName,
        type: "element"
      };

      stack[stack.length - 1]?.children.push(element);

      if (!selfClosing) {
        stack.push(element);
      }

      continue;
    }

    stack[stack.length - 1]?.children.push({
      text: decodeHtmlEntities(token),
      type: "text"
    });
  }

  return root.children;
}

function toCamelCaseCssProperty(name: string): string {
  return name
    .trim()
    .replace(/^-+/, "")
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function parseStyleAttribute(value: string): React.CSSProperties | undefined {
  const style: Record<string, string> = {};

  for (const declaration of value.split(";")) {
    const separatorIndex = declaration.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const property = toCamelCaseCssProperty(declaration.slice(0, separatorIndex));
    const propertyValue = declaration.slice(separatorIndex + 1).trim();

    if (!property || !propertyValue) {
      continue;
    }

    style[property] = propertyValue;
  }

  if (Object.keys(style).length === 0) {
    return undefined;
  }

  return style as React.CSSProperties;
}

function toRawHtmlDomProps(attributes: RawHtmlAttribute[]): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const { name, value } of attributes) {
    if (name.startsWith("on")) {
      continue;
    }

    if (RAW_HTML_URL_ATTRS.has(name) && RAW_HTML_UNSAFE_PROTOCOL.test(value)) {
      continue;
    }

    if (name === "class") {
      props.className = value;
      continue;
    }

    if (name === "for") {
      props.htmlFor = value;
      continue;
    }

    if (name === "style") {
      const style = parseStyleAttribute(value);
      if (style) {
        props.style = style;
      }
      continue;
    }

    if (RAW_HTML_BOOLEAN_ATTRS.has(name) && value.length === 0) {
      props[name] = true;
      continue;
    }

    props[name] = value;
  }

  return props;
}

function renderRawHtmlNode(node: RawHtmlNode, key: string): React.ReactNode | null {
  if (node.type === "text") {
    return node.text;
  }

  if (RAW_HTML_BLOCKED_TAGS.has(node.tagName)) {
    return null;
  }

  const children = renderRawHtmlNodes(node.children, key);
  return createElement(
    node.tagName,
    withKey(toRawHtmlDomProps(node.attributes), key),
    children.length > 0 ? children : undefined
  );
}

function renderRawHtmlNodes(nodes: RawHtmlNode[], keyPrefix: string): React.ReactNode[] {
  const rendered: React.ReactNode[] = [];

  for (const [index, node] of nodes.entries()) {
    const next = renderRawHtmlNode(node, `${keyPrefix}-${index}`);
    if (next !== null) {
      rendered.push(next);
    }
  }

  return rendered;
}

function rawHtmlChildren(value: string, keyPrefix: string): React.ReactNode[] {
  return renderRawHtmlNodes(parseRawHtmlFragment(value), keyPrefix);
}

function renderWithOverride(
  override: React.ElementType | undefined,
  fallback: React.ElementType,
  domProps: Record<string, unknown>,
  customProps: Record<string, unknown>,
  key?: React.Key,
  children?: React.ReactNode
): React.ReactNode {
  const Component = override ?? fallback;
  const props =
    typeof Component === "string"
      ? withKey(domProps, key)
      : withKey(
          {
            ...domProps,
            ...customProps
          },
          key
        );

  return createElement(Component, props, children);
}

function renderDoc(
  node: DjotDocNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const footnoteState = createFootnoteState(node);
  const children = renderChildren(node.children, components, footnoteState);
  const endnotes = renderEndnotes(node, components, footnoteState);
  const allChildren = endnotes ? [...children, endnotes] : children;
  const Component = pickComponent(components, "doc");

  if (Component) {
    if (typeof Component === "string") {
      return createElement(Component, withKey({}, key), allChildren);
    }

    return createElement(Component, withKey({ node }, key), allChildren);
  }

  return createElement(Fragment, withKey({}, key), allChildren);
}

function renderSection(
  node: DjotSectionNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const Component = pickComponent(components, "section");

  if (Component) {
    if (typeof Component === "string") {
      return createElement(Component, withKey({}, key), children);
    }

    return createElement(
      Component,
      withKey(
        {
          node
        },
        key
      ),
      children
    );
  }

  return createElement(Fragment, withKey({}, key), children);
}

function renderDiv(
  node: DjotDivNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "div"),
    "div",
    toDomPropsFromAttributes(node.attributes),
    {
      node
    },
    key,
    children
  );
}

function renderTable(
  node: DjotTableNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const captionChildren: React.ReactNode[] = [];
  const headRows: React.ReactNode[] = [];
  const bodyRows: React.ReactNode[] = [];
  const otherChildren: React.ReactNode[] = [];

  for (const [index, child] of node.children.entries()) {
    const rendered = renderNode(child, {
      components,
      footnoteState,
      key: index
    });

    if (child.tag === "caption") {
      captionChildren.push(rendered);
      continue;
    }

    if (child.tag === "row") {
      if (child.head && bodyRows.length === 0) {
        headRows.push(rendered);
      } else {
        bodyRows.push(rendered);
      }
      continue;
    }

    otherChildren.push(rendered);
  }

  const children: React.ReactNode[] = [...captionChildren];

  if (headRows.length > 0) {
    children.push(createElement("thead", { key: "thead" }, headRows));
  }

  if (bodyRows.length > 0) {
    children.push(createElement("tbody", { key: "tbody" }, bodyRows));
  }

  if (otherChildren.length > 0) {
    children.push(...otherChildren);
  }

  return renderWithOverride(
    pickComponent(components, "table"),
    "table",
    toDomPropsFromAttributes(node.attributes),
    {
      node
    },
    key,
    children
  );
}

function renderCaption(
  node: DjotCaptionNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const Component = pickComponent(components, "caption");

  if (!Component && children.length === 0) {
    return null;
  }

  return renderWithOverride(
    Component,
    "caption",
    toDomPropsFromAttributes(node.attributes),
    {
      node
    },
    key,
    children
  );
}

function renderRow(
  node: DjotRowNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "row"),
    "tr",
    toDomPropsFromAttributes(node.attributes),
    {
      head: node.head,
      node
    },
    key,
    children
  );
}

function renderCell(
  node: DjotCellNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const textAlign = textAlignForCell(node.align);
  const domProps = {
    ...toDomPropsFromAttributes(node.attributes),
    style: textAlign ? { textAlign } : undefined
  };

  return renderWithOverride(
    pickComponent(components, "cell"),
    node.head ? "th" : "td",
    domProps,
    {
      align: node.align,
      head: node.head,
      node
    },
    key,
    children
  );
}

function renderHeading(
  node: DjotHeadingNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const level = clampHeadingLevel(node.level);
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "heading"),
    `h${level}`,
    {},
    {
      level,
      node
    },
    key,
    children
  );
}

function renderMark(
  node: DjotMarkNode | DjotHighlightedNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key: React.Key | undefined,
  primary: "mark" | "highlighted",
  alias: "mark" | "highlighted"
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, primary, alias),
    "mark",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderSuperscript(
  node: DjotSuperscriptNode | DjotSupeNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key: React.Key | undefined,
  primary: "superscript" | "supe",
  alias: "superscript" | "supe"
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, primary, alias),
    "sup",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderSubscript(
  node: DjotSubscriptNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "subscript"),
    "sub",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderInsert(
  node: DjotInsertNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "insert"),
    "ins",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderDelete(
  node: DjotDeleteNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "delete"),
    "del",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderFootnoteReference(
  node: DjotFootnoteReferenceNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const label = node.text;
  const index = footnoteState ? ensureFootnoteIndex(label, footnoteState) : 1;
  const refCount = (footnoteState?.refCountByLabel.get(label) ?? 0) + 1;

  if (footnoteState) {
    footnoteState.refCountByLabel.set(label, refCount);
  }

  const id = refCount === 1 ? `fnref${index}` : `fnref${index}-${refCount}`;
  if (footnoteState && !footnoteState.firstRefIdByLabel.has(label)) {
    footnoteState.firstRefIdByLabel.set(label, id);
  }

  const href = `#fn${index}`;
  const children = createElement("sup", null, index);
  return renderWithOverride(
    pickComponent(components, "footnote_reference"),
    "a",
    {
      href,
      id,
      role: "doc-noteref"
    },
    {
      index,
      label,
      node
    },
    key,
    children
  );
}

function renderEndnotes(
  node: DjotDocNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState
): React.ReactNode {
  if (footnoteState.order.length === 0) {
    return null;
  }

  const items = footnoteState.order.map((label, itemIndex) => {
    const index = itemIndex + 1;
    const footnoteNode = node.footnotes?.[label] ?? {
      children: [],
      label,
      tag: "footnote"
    };

    const footnoteChildren = renderChildren(footnoteNode.children, components, footnoteState);
    const backlink = createElement(
      "a",
      {
        href: `#${footnoteState.firstRefIdByLabel.get(label) ?? `fnref${index}`}`,
        role: "doc-backlink"
      },
      "\u21a9\ufe0e"
    );

    const content = appendBacklink(footnoteChildren, backlink);

    return renderWithOverride(
      pickComponent(components, "footnote"),
      "li",
      {
        id: `fn${index}`,
        key: label
      },
      {
        index,
        label,
        node: footnoteNode
      },
      label,
      content
    );
  });

  const ol = createElement("ol", null, items);
  const sectionChildren = [createElement("hr", { key: "hr" }), createElement(Fragment, { key: "ol" }, ol)];
  return renderWithOverride(
    pickComponent(components, "endnotes"),
    "section",
    {
      role: "doc-endnotes"
    },
    {
      node,
      order: footnoteState.order
    },
    "endnotes",
    sectionChildren
  );
}

function renderQuoted(
  node: DjotDoubleQuotedNode | DjotSingleQuotedNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key: React.Key | undefined,
  primary: "double_quoted" | "single_quoted",
  alias: "double_quoted" | "single_quoted",
  openQuote: string,
  closeQuote: string
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const Component = pickComponent(components, primary, alias);

  if (!Component) {
    return createElement(Fragment, withKey({}, key), openQuote, children, closeQuote);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), openQuote, children, closeQuote);
  }

  return createElement(
    Component,
    withKey(
      {
        node
      },
      key
    ),
    openQuote,
    children,
    closeQuote
  );
}

function renderSmartPunctuation(
  node: DjotSmartPunctuationNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = toSmartPunctuation(node.type, node.text);
  const Component = pickComponent(components, "smart_punctuation");

  if (!Component) {
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        kind: node.type,
        node,
        value
      },
      key
    ),
    value
  );
}

function renderInlineMath(
  node: DjotInlineMathNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  return renderWithOverride(
    pickComponent(components, "inline_math"),
    "span",
    {
      className: "math inline"
    },
    {
      node,
      value
    },
    key,
    `\\(${value}\\)`
  );
}

function renderDisplayMath(
  node: DjotDisplayMathNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  return renderWithOverride(
    pickComponent(components, "display_math"),
    "span",
    {
      className: "math display"
    },
    {
      node,
      value
    },
    key,
    `\\[${value}\\]`
  );
}

function renderCode(
  node: DjotCodeNode | DjotVerbatimNode,
  components: DjotComponents | undefined,
  key: React.Key | undefined,
  primary: "code" | "verbatim",
  alias: "code" | "verbatim"
): React.ReactNode {
  const value = node.text;
  return renderWithOverride(
    pickComponent(components, primary, alias),
    "code",
    {},
    {
      node,
      value
    },
    key,
    value
  );
}

function renderCodeBlock(
  node: DjotCodeBlockNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  const language = node.lang;
  const fallbackChildren = createElement(
    "code",
    {
      className: language ? `language-${language}` : undefined
    },
    value
  );

  return renderWithOverride(
    pickComponent(components, "code_block"),
    "pre",
    {},
    {
      language,
      node,
      value
    },
    key,
    fallbackChildren
  );
}

function renderRawBlock(
  node: DjotRawBlockNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const format = node.format;
  const value = node.text;
  const htmlChildren = format === "html" ? rawHtmlChildren(value, `raw-block-${String(key ?? "node")}`) : undefined;
  const Component = pickComponent(components, "raw_block");

  if (!Component) {
    if (format !== "html") {
      return null;
    }

    return createElement(Fragment, withKey({}, key), htmlChildren);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), htmlChildren ?? value);
  }

  return createElement(
    Component,
    withKey(
      {
        format,
        node,
        value
      },
      key
    ),
    htmlChildren ?? value
  );
}

function renderRawInline(
  node: DjotRawInlineNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const format = node.format;
  const value = node.text;
  const htmlChildren = format === "html" ? rawHtmlChildren(value, `raw-inline-${String(key ?? "node")}`) : undefined;
  const Component = pickComponent(components, "raw_inline");

  if (!Component) {
    if (format !== "html") {
      return null;
    }

    return createElement(Fragment, withKey({}, key), htmlChildren);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), htmlChildren ?? value);
  }

  return createElement(
    Component,
    withKey(
      {
        format,
        node,
        value
      },
      key
    ),
    htmlChildren ?? value
  );
}

function renderUrl(
  node: DjotUrlNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  const href = value;
  return renderWithOverride(
    pickComponent(components, "url"),
    "a",
    {
      ...toDomPropsFromAttributes(node.attributes),
      href
    },
    {
      href,
      node,
      value
    },
    key,
    value
  );
}

function renderEmail(
  node: DjotEmailNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  const href = `mailto:${value}`;
  return renderWithOverride(
    pickComponent(components, "email"),
    "a",
    {
      ...toDomPropsFromAttributes(node.attributes),
      href
    },
    {
      href,
      node,
      value
    },
    key,
    value
  );
}

function renderSymb(
  node: DjotSymbNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const alias = node.alias;
  const value = `:${alias}:`;
  const Component = pickComponent(components, "symb");

  if (!Component) {
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(toDomPropsFromAttributes(node.attributes), key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...toDomPropsFromAttributes(node.attributes),
        alias,
        node,
        value
      },
      key
    ),
    value
  );
}

function renderLink(
  node: DjotLinkNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const href = node.destination;
  return renderWithOverride(
    pickComponent(components, "link"),
    "a",
    {
      href
    },
    {
      node
    },
    key,
    children
  );
}

function renderImage(
  node: DjotImageNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const alt = toAltText(node.children) || undefined;
  const src = node.destination;
  return renderWithOverride(
    pickComponent(components, "image"),
    "img",
    {
      alt,
      src
    },
    {
      alt,
      node
    },
    key
  );
}

function renderOrderedList(
  node: DjotOrderedListNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "ordered_list"),
    "ol",
    {
      start: node.start
    },
    {
      node,
      start: node.start
    },
    key,
    children
  );
}

function renderBlockQuote(
  node: DjotBlockquoteNode | DjotBlockQuoteNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key: React.Key | undefined,
  primary: "blockquote" | "block_quote",
  alias: "blockquote" | "block_quote"
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, primary, alias),
    "blockquote",
    {},
    {
      node
    },
    key,
    children
  );
}

function renderStr(
  node: DjotStrNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  const Component = pickComponent(components, "str");

  if (!Component) {
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        node,
        value
      },
      key
    ),
    value
  );
}

function renderNonBreakingSpace(
  node: DjotNonBreakingSpaceNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = "\u00a0";
  const Component = pickComponent(components, "non_breaking_space");

  if (!Component) {
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        node,
        value
      },
      key
    ),
    value
  );
}

function renderSoftBreak(
  node: DjotSoftBreakNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const Component = pickComponent(components, "soft_break", "softbreak");

  if (!Component) {
    return "\n";
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey({}, key), "\n");
  }

  return createElement(
    Component,
    withKey(
      {
        node
      },
      key
    ),
    "\n"
  );
}

function renderHardBreak(
  node: DjotHardBreakNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  return renderWithOverride(
    pickComponent(components, "hard_break", "hardbreak"),
    "br",
    {},
    {
      node
    },
    key
  );
}

export function renderNode(node: DjotNode, options: RenderNodeOptions = {}): React.ReactNode {
  const { components, footnoteState, key } = options;
  const children = isParentNode(node) ? renderChildren(node.children, components, footnoteState) : undefined;

  switch (node.tag) {
    case "doc":
      return renderDoc(node, components, key);
    case "section":
      return renderSection(node, components, footnoteState, key);
    case "div":
      return renderDiv(node, components, footnoteState, key);
    case "table":
      return renderTable(node, components, footnoteState, key);
    case "caption":
      return renderCaption(node, components, footnoteState, key);
    case "row":
      return renderRow(node, components, footnoteState, key);
    case "cell":
      return renderCell(node, components, footnoteState, key);
    case "para":
      return renderWithOverride(
        pickComponent(components, "para"),
        "p",
        {},
        {
          node
        },
        key,
        children
      );
    case "heading":
      return renderHeading(node, components, footnoteState, key);
    case "emph":
      return renderWithOverride(
        pickComponent(components, "emph"),
        "em",
        {},
        {
          node
        },
        key,
        children
      );
    case "strong":
      return renderWithOverride(
        pickComponent(components, "strong"),
        "strong",
        {},
        {
          node
        },
        key,
        children
      );
    case "mark":
      return renderMark(node, components, footnoteState, key, "mark", "highlighted");
    case "highlighted":
      return renderMark(node, components, footnoteState, key, "highlighted", "mark");
    case "superscript":
      return renderSuperscript(node, components, footnoteState, key, "superscript", "supe");
    case "supe":
      return renderSuperscript(node, components, footnoteState, key, "supe", "superscript");
    case "subscript":
      return renderSubscript(node, components, footnoteState, key);
    case "insert":
      return renderInsert(node, components, footnoteState, key);
    case "delete":
      return renderDelete(node, components, footnoteState, key);
    case "span":
      return renderWithOverride(
        pickComponent(components, "span"),
        "span",
        toDomPropsFromAttributes(node.attributes),
        {
          node
        },
        key,
        children
      );
    case "footnote_reference":
      return renderFootnoteReference(node, components, footnoteState, key);
    case "footnote":
      return renderWithOverride(
        pickComponent(components, "footnote"),
        "li",
        {},
        {
          index: 0,
          label: node.label,
          node
        },
        key,
        children
      );
    case "double_quoted":
      return renderQuoted(
        node,
        components,
        footnoteState,
        key,
        "double_quoted",
        "single_quoted",
        "\u201c",
        "\u201d"
      );
    case "single_quoted":
      return renderQuoted(
        node,
        components,
        footnoteState,
        key,
        "single_quoted",
        "double_quoted",
        "\u2018",
        "\u2019"
      );
    case "smart_punctuation":
      return renderSmartPunctuation(node, components, key);
    case "symb":
      return renderSymb(node, components, key);
    case "inline_math":
      return renderInlineMath(node, components, key);
    case "display_math":
      return renderDisplayMath(node, components, key);
    case "code":
      return renderCode(node, components, key, "code", "verbatim");
    case "verbatim":
      return renderCode(node, components, key, "verbatim", "code");
    case "code_block":
      return renderCodeBlock(node, components, key);
    case "raw_block":
      return renderRawBlock(node, components, key);
    case "raw_inline":
      return renderRawInline(node, components, key);
    case "url":
      return renderUrl(node, components, key);
    case "email":
      return renderEmail(node, components, key);
    case "link":
      return renderLink(node, components, footnoteState, key);
    case "image":
      return renderImage(node, components, key);
    case "bullet_list":
      return renderWithOverride(
        pickComponent(components, "bullet_list"),
        "ul",
        {},
        {
          node
        },
        key,
        children
      );
    case "ordered_list":
      return renderOrderedList(node, components, footnoteState, key);
    case "list_item":
      return renderWithOverride(
        pickComponent(components, "list_item"),
        "li",
        {},
        {
          node
        },
        key,
        children
      );
    case "blockquote":
      return renderBlockQuote(node, components, footnoteState, key, "blockquote", "block_quote");
    case "block_quote":
      return renderBlockQuote(node, components, footnoteState, key, "block_quote", "blockquote");
    case "thematic_break":
      return renderWithOverride(
        pickComponent(components, "thematic_break"),
        "hr",
        {},
        {
          node
        },
        key
      );
    case "str":
      return renderStr(node, components, key);
    case "non_breaking_space":
      return renderNonBreakingSpace(node, components, key);
    default:
      if (isSoftBreakNode(node)) {
        return renderSoftBreak(node, components, key);
      }

      if (isHardBreakNode(node)) {
        return renderHardBreak(node, components, key);
      }

      return null;
  }
}
