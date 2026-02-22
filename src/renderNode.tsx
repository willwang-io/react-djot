import { createElement, Fragment } from "react";
import type React from "react";
import type {
  DjotBaseNode,
  DjotBlockQuoteNode,
  DjotBlockquoteNode,
  DjotBulletListNode,
  DjotCaptionNode,
  DjotCellNode,
  DjotCodeBlockNode,
  DjotCodeNode,
  DjotComponentPropsMap,
  DjotComponents,
  DjotDeleteNode,
  DjotDefinitionListItemNode,
  DjotDefinitionListNode,
  DjotDefinitionNode,
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
  DjotListItemNode,
  DjotMarkNode,
  DjotNonBreakingSpaceNode,
  DjotNode,
  DjotOrderedListNode,
  DjotParentNode,
  DjotTaskListItemNode,
  DjotTaskListNode,
  DjotRawBlockNode,
  DjotRawInlineNode,
  DjotRowNode,
  DjotSectionNode,
  DjotSoftBreakNode,
  DjotSmartPunctuationNode,
  DjotSingleQuotedNode,
  DjotStrNode,
  DjotSubscriptNode,
  DjotSymbNode,
  DjotSuperscriptNode,
  DjotSupeNode,
  DjotTableNode,
  DjotTermNode,
  DjotUrlNode,
  DjotVerbatimNode
} from "./types";
import {
  appendBacklink,
  createFootnoteState,
  ensureFootnoteIndex,
  resolveReferenceDestination,
  resolveReferenceNode,
  type FootnoteState
} from "./renderNode.footnotes";
import { rawHtmlChildren } from "./renderNode.rawHtml";
import {
  clampHeadingLevel,
  mergeDomProps,
  textAlignForCell,
  toAltText,
  toOrderedListType,
  toSmartPunctuation,
  toDomPropsFromNode,
  withKey
} from "./renderNode.utils";

export interface RenderNodeOptions {
  components?: DjotComponents | undefined;
  footnoteState?: FootnoteState | undefined;
  key?: React.Key;
  listTight?: boolean | undefined;
}

type ComponentKey = keyof DjotComponentPropsMap;

interface FootnoteState {
  autoReferencesByLabel: Record<string, DjotReferenceNode>;
  firstRefIdByLabel: Map<string, string>;
  indexByLabel: Map<string, number>;
  order: string[];
  referencesByLabel: Record<string, DjotReferenceNode>;
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
  footnoteState?: FootnoteState,
  listTight?: boolean
): React.ReactNode[] {
  return children.map((child, index) =>
    renderNode(child, {
      components,
      footnoteState,
      key: index,
      listTight
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
    autoReferencesByLabel: node.autoReferences ?? {},
    firstRefIdByLabel: new Map<string, string>(),
    indexByLabel,
    order,
    referencesByLabel: node.references ?? {},
    refCountByLabel: new Map<string, number>()
  };
}

function resolveReferenceDestination(
  node: Pick<DjotLinkNode, "destination" | "reference"> | Pick<DjotImageNode, "destination" | "reference">,
  footnoteState: FootnoteState | undefined
): string | undefined {
  if (node.destination) {
    return node.destination;
  }

  return resolveReferenceNode(node, footnoteState)?.destination;
}

function resolveReferenceNode(
  node: Pick<DjotLinkNode, "reference"> | Pick<DjotImageNode, "reference">,
  footnoteState: FootnoteState | undefined
): DjotReferenceNode | undefined {
  if (!node.reference || !footnoteState) {
    return undefined;
  }

  return footnoteState.referencesByLabel[node.reference] ?? footnoteState.autoReferencesByLabel[node.reference];
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
    const domProps = mergeDomProps(node);
    if (typeof Component === "string") {
      return createElement(Component, withKey(domProps, key), allChildren);
    }

    return createElement(Component, withKey({ ...domProps, node }, key), allChildren);
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
  return renderWithOverride(
    pickComponent(components, "section"),
    "section",
    mergeDomProps(node),
    {
      node
    },
    key,
    children
  );
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
  const domProps = mergeDomProps(node, {
    style: textAlign ? { textAlign } : undefined
  });

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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
    mergeDomProps(node, {
      href,
      id,
      role: "doc-noteref"
    }),
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
      mergeDomProps(footnoteNode, {
        id: `fn${index}`,
        key: label
      }),
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
  const domProps = mergeDomProps(node);

  if (!Component) {
    return createElement(Fragment, withKey({}, key), openQuote, children, closeQuote);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), openQuote, children, closeQuote);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
  const domProps = mergeDomProps(node);

  if (!Component) {
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
    mergeDomProps(node, {
      className: "math inline"
    }),
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
    mergeDomProps(node, {
      className: "math display"
    }),
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
    mergeDomProps(node),
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
    mergeDomProps(node),
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
  const domProps = mergeDomProps(node);

  if (!Component) {
    if (format !== "html") {
      return null;
    }

    return createElement(Fragment, withKey({}, key), htmlChildren);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), htmlChildren ?? value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
  const domProps = mergeDomProps(node);

  if (!Component) {
    if (format !== "html") {
      return null;
    }

    return createElement(Fragment, withKey({}, key), htmlChildren);
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), htmlChildren ?? value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
    mergeDomProps(node, {
      href
    }),
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
    mergeDomProps(node, {
      href
    }),
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
    return createElement(Component, withKey(mergeDomProps(node), key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...mergeDomProps(node),
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
  const referenceNode = resolveReferenceNode(node, footnoteState);
  const referenceProps = referenceNode ? toDomPropsFromNode(referenceNode) : {};
  const href = resolveReferenceDestination(node, footnoteState);
  return renderWithOverride(
    pickComponent(components, "link"),
    "a",
    mergeDomProps(node, {
      href,
      ...referenceProps
    }),
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
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const alt = toAltText(node.children) || undefined;
  const referenceNode = resolveReferenceNode(node, footnoteState);
  const referenceProps = referenceNode ? toDomPropsFromNode(referenceNode) : {};
  const src = resolveReferenceDestination(node, footnoteState);
  return renderWithOverride(
    pickComponent(components, "image"),
    "img",
    mergeDomProps(node, {
      alt,
      src,
      ...referenceProps
    }),
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
  const tight = node.tight ?? false;
  const children = renderChildren(node.children, components, footnoteState, tight);
  const start = node.start !== undefined && node.start !== 1 ? node.start : undefined;
  const type = toOrderedListType(node.style);
  return renderWithOverride(
    pickComponent(components, "ordered_list"),
    "ol",
    mergeDomProps(node, {
      start,
      type
    }),
    {
      node,
      start,
      tight
    },
    key,
    children
  );
}

function renderDefinitionList(
  node: DjotDefinitionListNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "definition_list"),
    "dl",
    mergeDomProps(node),
    {
      node
    },
    key,
    children
  );
}

function renderDefinitionListItem(
  node: DjotDefinitionListItemNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  const Component = pickComponent(components, "definition_list_item");
  const domProps = mergeDomProps(node);

  if (Component) {
    if (typeof Component === "string") {
      return createElement(Component, withKey(domProps, key), children);
    }

    return createElement(
      Component,
      withKey(
        {
          ...domProps,
          node
        },
        key
      ),
      children
    );
  }

  return createElement(Fragment, withKey({}, key), children);
}

function renderBulletList(
  node: DjotBulletListNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const tight = node.tight ?? false;
  const children = renderChildren(node.children, components, footnoteState, tight);
  return renderWithOverride(
    pickComponent(components, "bullet_list"),
    "ul",
    mergeDomProps(node),
    {
      node,
      tight
    },
    key,
    children
  );
}

function renderListItem(
  node: DjotListItemNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  listTight: boolean | undefined,
  key?: React.Key
): React.ReactNode {
  const override = pickComponent(components, "list_item");

  if (override) {
    const domProps = mergeDomProps(node);
    const contentChildren = renderChildren(node.children, components, footnoteState);
    if (typeof override === "string") {
      return createElement(override, withKey(domProps, key), contentChildren);
    }
    return createElement(
      override,
      withKey({ ...domProps, node, tight: listTight }, key),
      contentChildren
    );
  }

  const firstChild = node.children[0];
  const inlineSource =
    listTight === true && node.children.length === 1 && firstChild?.tag === "para"
      ? (firstChild as DjotParentNode).children
      : node.children;
  const contentChildren = renderChildren(inlineSource, components, footnoteState);

  return createElement("li", withKey(mergeDomProps(node), key), contentChildren);
}

function renderTerm(
  node: DjotTermNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "term"),
    "dt",
    mergeDomProps(node),
    {
      node
    },
    key,
    children
  );
}

function renderDefinition(
  node: DjotDefinitionNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components, footnoteState);
  return renderWithOverride(
    pickComponent(components, "definition"),
    "dd",
    mergeDomProps(node),
    {
      node
    },
    key,
    children
  );
}

function renderTaskList(
  node: DjotTaskListNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  key?: React.Key
): React.ReactNode {
  const tight = node.tight ?? false;
  const children = renderChildren(node.children, components, footnoteState, tight);
  return renderWithOverride(
    pickComponent(components, "task_list"),
    "ul",
    mergeDomProps(node, { className: "task-list" }),
    { node, tight },
    key,
    children
  );
}

function renderTaskListItem(
  node: DjotTaskListItemNode,
  components: DjotComponents | undefined,
  footnoteState: FootnoteState | undefined,
  listTight: boolean | undefined,
  key?: React.Key
): React.ReactNode {
  const override = pickComponent(components, "task_list_item");

  if (override) {
    const domProps = mergeDomProps(node);
    const contentChildren = renderChildren(node.children, components, footnoteState);
    if (typeof override === "string") {
      return createElement(override, withKey(domProps, key), contentChildren);
    }
    return createElement(
      override,
      withKey({ ...domProps, node, checkbox: node.checkbox, tight: listTight }, key),
      contentChildren
    );
  }

  // In tight task lists, paragraph wrappers are suppressed to keep text inline
  // with the checkbox. Loose task lists preserve paragraph wrappers.
  const firstChild = node.children[0];
  const inlineSource =
    listTight === true && node.children.length === 1 && firstChild?.tag === "para"
      ? (firstChild as DjotParentNode).children
      : node.children;
  const contentChildren = renderChildren(inlineSource, components, footnoteState);

  const checkboxEl = createElement("input", {
    key: "checkbox",
    type: "checkbox",
    disabled: true,
    checked: node.checkbox === "checked"
  });
  return createElement("li", withKey(mergeDomProps(node), key), [checkboxEl, contentChildren]);
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
    mergeDomProps(node),
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
  const domProps = mergeDomProps(node);
  const hasNodeDomProps = Object.keys(domProps).length > 0;

  if (!Component) {
    if (hasNodeDomProps) {
      return createElement("span", withKey(domProps, key), value);
    }
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
  const domProps = mergeDomProps(node);
  const hasNodeDomProps = Object.keys(domProps).length > 0;

  if (!Component) {
    if (hasNodeDomProps) {
      return createElement("span", withKey(domProps, key), value);
    }
    return value;
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), value);
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
  const domProps = mergeDomProps(node);

  if (!Component) {
    return "\n";
  }

  if (typeof Component === "string") {
    return createElement(Component, withKey(domProps, key), "\n");
  }

  return createElement(
    Component,
    withKey(
      {
        ...domProps,
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
    mergeDomProps(node),
    {
      node
    },
    key
  );
}

export function renderNode(node: DjotNode, options: RenderNodeOptions = {}): React.ReactNode {
  const { components, footnoteState, key, listTight } = options;
  const children = isParentNode(node)
    ? renderChildren(node.children, components, footnoteState, listTight)
    : undefined;

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
        mergeDomProps(node),
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
        mergeDomProps(node),
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
        mergeDomProps(node),
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
        mergeDomProps(node),
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
        mergeDomProps(node),
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
      return renderImage(node, components, footnoteState, key);
    case "bullet_list":
      return renderBulletList(node, components, footnoteState, key);
    case "ordered_list":
      return renderOrderedList(node, components, footnoteState, key);
    case "list_item":
      return renderListItem(node, components, footnoteState, listTight, key);
    case "definition_list":
      return renderDefinitionList(node, components, footnoteState, key);
    case "definition_list_item":
      return renderDefinitionListItem(node, components, footnoteState, key);
    case "term":
      return renderTerm(node, components, footnoteState, key);
    case "definition":
      return renderDefinition(node, components, footnoteState, key);
    case "task_list":
      return renderTaskList(node, components, footnoteState, key);
    case "task_list_item":
      return renderTaskListItem(node, components, footnoteState, listTight, key);
    case "blockquote":
      return renderBlockQuote(node, components, footnoteState, key, "blockquote", "block_quote");
    case "block_quote":
      return renderBlockQuote(node, components, footnoteState, key, "block_quote", "blockquote");
    case "thematic_break":
      return renderWithOverride(
        pickComponent(components, "thematic_break"),
        "hr",
        mergeDomProps(node),
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
