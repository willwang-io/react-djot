import { createElement } from "react";
import type React from "react";
import { withKey } from "./renderNode.utils";

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

export function rawHtmlChildren(value: string, keyPrefix: string): React.ReactNode[] {
  return renderRawHtmlNodes(parseRawHtmlFragment(value), keyPrefix);
}
