import type React from "react";

export type DjotAttributes = Record<string, string>;

export interface DjotBaseNode {
  attributes?: DjotAttributes;
  tag: string;
}

export interface DjotParentNode extends DjotBaseNode {
  children: DjotNode[];
}

export interface DjotDocNode extends DjotParentNode {
  tag: "doc";
}

export interface DjotParaNode extends DjotParentNode {
  tag: "para";
}

export interface DjotHeadingNode extends DjotParentNode {
  level: number;
  tag: "heading";
}

export interface DjotEmphNode extends DjotParentNode {
  tag: "emph";
}

export interface DjotStrongNode extends DjotParentNode {
  tag: "strong";
}

export interface DjotCodeNode extends DjotBaseNode {
  tag: "code";
  text: string;
}

export interface DjotCodeBlockNode extends DjotBaseNode {
  lang?: string;
  tag: "code_block";
  text: string;
}

export interface DjotLinkNode extends DjotParentNode {
  destination: string;
  tag: "link";
}

export interface DjotImageNode extends DjotParentNode {
  destination: string;
  tag: "image";
}

export interface DjotBulletListNode extends DjotParentNode {
  tag: "bullet_list";
}

export interface DjotOrderedListNode extends DjotParentNode {
  start?: number;
  tag: "ordered_list";
}

export interface DjotListItemNode extends DjotParentNode {
  tag: "list_item";
}

export interface DjotBlockquoteNode extends DjotParentNode {
  tag: "blockquote";
}

export interface DjotThematicBreakNode extends DjotBaseNode {
  tag: "thematic_break";
}

export interface DjotStrNode extends DjotBaseNode {
  tag: "str";
  text: string;
}

export interface DjotSoftBreakNode extends DjotBaseNode {
  tag: "soft_break" | "softbreak";
}

export interface DjotHardBreakNode extends DjotBaseNode {
  tag: "hard_break" | "hardbreak";
}

export type DjotNode =
  | DjotDocNode
  | DjotParaNode
  | DjotHeadingNode
  | DjotEmphNode
  | DjotStrongNode
  | DjotCodeNode
  | DjotCodeBlockNode
  | DjotLinkNode
  | DjotImageNode
  | DjotBulletListNode
  | DjotOrderedListNode
  | DjotListItemNode
  | DjotBlockquoteNode
  | DjotThematicBreakNode
  | DjotStrNode
  | DjotSoftBreakNode
  | DjotHardBreakNode;

export type DjotNodeTag = DjotNode["tag"];

export type DjotNodeByTag<Tag extends DjotNodeTag> = Extract<DjotNode, { tag: Tag }>;

interface DjotNodePropsBase<Tag extends DjotNodeTag> {
  children?: React.ReactNode;
  node: DjotNodeByTag<Tag>;
}

export interface DjotComponentPropsMap {
  doc: DjotNodePropsBase<"doc">;
  para: React.HTMLAttributes<HTMLParagraphElement> & DjotNodePropsBase<"para">;
  heading: React.HTMLAttributes<HTMLHeadingElement> &
    DjotNodePropsBase<"heading"> & {
      level: number;
    };
  emph: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"emph">;
  strong: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"strong">;
  code: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"code"> & {
      value: string;
    };
  code_block: React.HTMLAttributes<HTMLPreElement> &
    DjotNodePropsBase<"code_block"> & {
      language?: string;
      value: string;
    };
  link: React.AnchorHTMLAttributes<HTMLAnchorElement> & DjotNodePropsBase<"link">;
  image: React.ImgHTMLAttributes<HTMLImageElement> &
    DjotNodePropsBase<"image"> & {
      alt?: string;
    };
  bullet_list: React.HTMLAttributes<HTMLUListElement> & DjotNodePropsBase<"bullet_list">;
  ordered_list: React.OlHTMLAttributes<HTMLOListElement> & DjotNodePropsBase<"ordered_list">;
  list_item: React.LiHTMLAttributes<HTMLLIElement> & DjotNodePropsBase<"list_item">;
  blockquote: React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
    DjotNodePropsBase<"blockquote">;
  thematic_break: React.HTMLAttributes<HTMLHRElement> & DjotNodePropsBase<"thematic_break">;
  str: DjotNodePropsBase<"str"> & {
    value: string;
  };
  soft_break: DjotNodePropsBase<"soft_break">;
  softbreak: DjotNodePropsBase<"softbreak">;
  hard_break: DjotNodePropsBase<"hard_break">;
  hardbreak: DjotNodePropsBase<"hardbreak">;
}

export type DjotComponents = Partial<{
  [K in keyof DjotComponentPropsMap]: React.ElementType<DjotComponentPropsMap[K]>;
}>;

export interface DjotProps {
  children?: string | null | undefined;
  components?: DjotComponents | undefined;
}
