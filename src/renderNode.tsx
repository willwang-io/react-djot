import { createElement, Fragment } from "react";
import type React from "react";
import type {
  DjotBaseNode,
  DjotCodeBlockNode,
  DjotCodeNode,
  DjotComponentPropsMap,
  DjotComponents,
  DjotDocNode,
  DjotHardBreakNode,
  DjotHeadingNode,
  DjotImageNode,
  DjotLinkNode,
  DjotNode,
  DjotOrderedListNode,
  DjotParentNode,
  DjotSoftBreakNode,
  DjotStrNode
} from "./types";

export interface RenderNodeOptions {
  components?: DjotComponents | undefined;
  key?: React.Key;
}

type ComponentKey = keyof DjotComponentPropsMap;

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

function renderChildren(children: DjotNode[], components?: DjotComponents): React.ReactNode[] {
  return children.map((child, index) =>
    renderNode(child, {
      components,
      key: index
    })
  );
}

function toAltText(nodes: DjotNode[]): string {
  let output = "";

  for (const node of nodes) {
    switch (node.tag) {
      case "str":
      case "code":
      case "code_block":
        output += node.text;
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
  const children = renderChildren(node.children, components);
  const Component = pickComponent(components, "doc");

  if (Component) {
    if (typeof Component === "string") {
      return createElement(Component, withKey({}, key), children);
    }

    return createElement(Component, withKey({ node }, key), children);
  }

  return createElement(Fragment, withKey({}, key), children);
}

function renderHeading(
  node: DjotHeadingNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const level = clampHeadingLevel(node.level);
  const children = renderChildren(node.children, components);
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

function renderCode(
  node: DjotCodeNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const value = node.text;
  return renderWithOverride(
    pickComponent(components, "code"),
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

function renderLink(
  node: DjotLinkNode,
  components: DjotComponents | undefined,
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components);
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
  key?: React.Key
): React.ReactNode {
  const children = renderChildren(node.children, components);
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
  const { components, key } = options;
  const children = isParentNode(node) ? renderChildren(node.children, components) : undefined;

  switch (node.tag) {
    case "doc":
      return renderDoc(node, components, key);
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
      return renderHeading(node, components, key);
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
    case "code":
      return renderCode(node, components, key);
    case "code_block":
      return renderCodeBlock(node, components, key);
    case "link":
      return renderLink(node, components, key);
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
      return renderOrderedList(node, components, key);
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
      return renderWithOverride(
        pickComponent(components, "blockquote"),
        "blockquote",
        {},
        {
          node
        },
        key,
        children
      );
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
