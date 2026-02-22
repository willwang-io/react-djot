import type React from "react";
import type {
  DjotBaseNode,
  DjotNode,
  DjotOrderedListStyle,
  DjotParentNode,
  DjotSmartPunctuationType,
  DjotTableAlignment
} from "./types";

function isParentNode(node: DjotBaseNode): node is DjotParentNode {
  return Array.isArray((node as DjotParentNode).children);
}

export function toSmartPunctuation(type: DjotSmartPunctuationType, fallback: string): string {
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

export function toAltText(nodes: DjotNode[]): string {
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

export function clampHeadingLevel(level: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (level <= 1) {
    return 1;
  }

  if (level >= 6) {
    return 6;
  }

  return level as 1 | 2 | 3 | 4 | 5 | 6;
}

export function withKey<T extends Record<string, unknown>>(props: T, key?: React.Key): T & { key?: React.Key } {
  if (key === undefined) {
    return props;
  }

  return {
    ...props,
    key
  };
}

export function toDomPropsFromAttributes(attributes: Record<string, string> | undefined): Record<string, unknown> {
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

export function toDomPropsFromNode(node: DjotBaseNode): Record<string, unknown> {
  return {
    ...toDomPropsFromAttributes(node.autoAttributes),
    ...toDomPropsFromAttributes(node.attributes)
  };
}

function joinClassNames(...values: Array<string | undefined>): string | undefined {
  const classes = values.filter((value): value is string => Boolean(value && value.length > 0));
  return classes.length > 0 ? classes.join(" ") : undefined;
}

function toStyleObject(value: unknown): React.CSSProperties | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as React.CSSProperties;
}

export function mergeDomProps(node: DjotBaseNode, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const nodeProps = toDomPropsFromNode(node);
  const merged: Record<string, unknown> = {
    ...extra,
    ...nodeProps
  };

  const className = joinClassNames(
    typeof extra.className === "string" ? extra.className : undefined,
    typeof nodeProps.className === "string" ? nodeProps.className : undefined
  );

  if (className) {
    merged.className = className;
  }

  const extraStyle = toStyleObject(extra.style);
  const nodeStyle = toStyleObject(nodeProps.style);
  if (extraStyle || nodeStyle) {
    merged.style = {
      ...(extraStyle ?? {}),
      ...(nodeStyle ?? {})
    };
  }

  return merged;
}

export function textAlignForCell(align: DjotTableAlignment): React.CSSProperties["textAlign"] | undefined {
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

export function toOrderedListType(style: DjotOrderedListStyle | undefined): string | undefined {
  if (!style || /1/.test(style)) {
    return undefined;
  }

  const type = style.replace(/[().]/g, "");
  return type.length > 0 ? type : undefined;
}
