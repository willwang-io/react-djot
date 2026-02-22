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
  autoReferences?: Record<string, unknown>;
  footnotes?: Record<string, DjotFootnoteNode>;
  references?: Record<string, unknown>;
  tag: "doc";
}

export interface DjotSectionNode extends DjotParentNode {
  autoAttributes?: DjotAttributes;
  tag: "section";
}

export interface DjotDivNode extends DjotParentNode {
  tag: "div";
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

export interface DjotMarkNode extends DjotParentNode {
  tag: "mark";
}

export interface DjotHighlightedNode extends DjotParentNode {
  tag: "highlighted";
}

export interface DjotSuperscriptNode extends DjotParentNode {
  tag: "superscript";
}

export interface DjotSupeNode extends DjotParentNode {
  tag: "supe";
}

export interface DjotSubscriptNode extends DjotParentNode {
  tag: "subscript";
}

export interface DjotInsertNode extends DjotParentNode {
  tag: "insert";
}

export interface DjotDeleteNode extends DjotParentNode {
  tag: "delete";
}

export interface DjotSpanNode extends DjotParentNode {
  tag: "span";
}

export type DjotTableAlignment = "default" | "left" | "right" | "center" | (string & {});

export interface DjotTableNode extends DjotParentNode {
  tag: "table";
}

export interface DjotCaptionNode extends DjotParentNode {
  tag: "caption";
}

export interface DjotRowNode extends DjotParentNode {
  head: boolean;
  tag: "row";
}

export interface DjotCellNode extends DjotParentNode {
  align: DjotTableAlignment;
  head: boolean;
  tag: "cell";
}

export interface DjotFootnoteReferenceNode extends DjotBaseNode {
  tag: "footnote_reference";
  text: string;
}

export interface DjotFootnoteNode extends DjotParentNode {
  label: string;
  tag: "footnote";
}

export interface DjotDoubleQuotedNode extends DjotParentNode {
  tag: "double_quoted";
}

export interface DjotSingleQuotedNode extends DjotParentNode {
  tag: "single_quoted";
}

export type DjotSmartPunctuationType =
  | "left_double_quote"
  | "right_double_quote"
  | "left_single_quote"
  | "right_single_quote"
  | "em_dash"
  | "en_dash"
  | "ellipses"
  | (string & {});

export interface DjotSmartPunctuationNode extends DjotBaseNode {
  tag: "smart_punctuation";
  text: string;
  type: DjotSmartPunctuationType;
}

export interface DjotInlineMathNode extends DjotBaseNode {
  tag: "inline_math";
  text: string;
}

export interface DjotDisplayMathNode extends DjotBaseNode {
  tag: "display_math";
  text: string;
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

export interface DjotRawBlockNode extends DjotBaseNode {
  format: string;
  tag: "raw_block";
  text: string;
}

export interface DjotRawInlineNode extends DjotBaseNode {
  format: string;
  tag: "raw_inline";
  text: string;
}

export interface DjotSymbNode extends DjotBaseNode {
  alias: string;
  tag: "symb";
}

export interface DjotUrlNode extends DjotBaseNode {
  tag: "url";
  text: string;
}

export interface DjotEmailNode extends DjotBaseNode {
  tag: "email";
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

export interface DjotDefinitionListNode extends DjotParentNode {
  tag: "definition_list";
}

export interface DjotDefinitionListItemNode extends DjotParentNode {
  tag: "definition_list_item";
}

export interface DjotTermNode extends DjotParentNode {
  tag: "term";
}

export interface DjotDefinitionNode extends DjotParentNode {
  tag: "definition";
}

export type DjotCheckboxStatus = "checked" | "unchecked";

export interface DjotTaskListNode extends DjotParentNode {
  tag: "task_list";
  tight?: boolean;
}

export interface DjotTaskListItemNode extends DjotParentNode {
  checkbox: DjotCheckboxStatus;
  tag: "task_list_item";
}

export interface DjotBlockquoteNode extends DjotParentNode {
  tag: "blockquote";
}

export interface DjotBlockQuoteNode extends DjotParentNode {
  tag: "block_quote";
}

export interface DjotThematicBreakNode extends DjotBaseNode {
  tag: "thematic_break";
}

export interface DjotStrNode extends DjotBaseNode {
  tag: "str";
  text: string;
}

export interface DjotVerbatimNode extends DjotBaseNode {
  tag: "verbatim";
  text: string;
}

export interface DjotSoftBreakNode extends DjotBaseNode {
  tag: "soft_break" | "softbreak";
}

export interface DjotHardBreakNode extends DjotBaseNode {
  tag: "hard_break" | "hardbreak";
}

export interface DjotNonBreakingSpaceNode extends DjotBaseNode {
  tag: "non_breaking_space";
}

export type DjotNode =
  | DjotDocNode
  | DjotSectionNode
  | DjotDivNode
  | DjotParaNode
  | DjotHeadingNode
  | DjotEmphNode
  | DjotStrongNode
  | DjotMarkNode
  | DjotHighlightedNode
  | DjotSuperscriptNode
  | DjotSupeNode
  | DjotSubscriptNode
  | DjotInsertNode
  | DjotDeleteNode
  | DjotSpanNode
  | DjotTableNode
  | DjotCaptionNode
  | DjotRowNode
  | DjotCellNode
  | DjotFootnoteReferenceNode
  | DjotFootnoteNode
  | DjotDoubleQuotedNode
  | DjotSingleQuotedNode
  | DjotSmartPunctuationNode
  | DjotInlineMathNode
  | DjotDisplayMathNode
  | DjotCodeNode
  | DjotCodeBlockNode
  | DjotRawBlockNode
  | DjotRawInlineNode
  | DjotSymbNode
  | DjotUrlNode
  | DjotEmailNode
  | DjotLinkNode
  | DjotImageNode
  | DjotBulletListNode
  | DjotOrderedListNode
  | DjotListItemNode
  | DjotDefinitionListNode
  | DjotDefinitionListItemNode
  | DjotTermNode
  | DjotDefinitionNode
  | DjotTaskListNode
  | DjotTaskListItemNode
  | DjotBlockquoteNode
  | DjotBlockQuoteNode
  | DjotThematicBreakNode
  | DjotStrNode
  | DjotVerbatimNode
  | DjotNonBreakingSpaceNode
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
  section: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"section">;
  div: React.HTMLAttributes<HTMLDivElement> & DjotNodePropsBase<"div">;
  para: React.HTMLAttributes<HTMLParagraphElement> & DjotNodePropsBase<"para">;
  heading: React.HTMLAttributes<HTMLHeadingElement> &
    DjotNodePropsBase<"heading"> & {
      level: number;
    };
  emph: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"emph">;
  strong: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"strong">;
  mark: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"mark">, "node"> & {
      node: DjotMarkNode | DjotHighlightedNode;
    };
  highlighted: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"highlighted">, "node"> & {
      node: DjotMarkNode | DjotHighlightedNode;
    };
  superscript: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"superscript">, "node"> & {
      node: DjotSuperscriptNode | DjotSupeNode;
    };
  supe: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"supe">, "node"> & {
      node: DjotSuperscriptNode | DjotSupeNode;
    };
  subscript: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"subscript">;
  insert: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"insert">;
  delete: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"delete">;
  span: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"span">;
  table: React.TableHTMLAttributes<HTMLTableElement> & DjotNodePropsBase<"table">;
  caption: React.HTMLAttributes<HTMLTableCaptionElement> & DjotNodePropsBase<"caption">;
  row: React.HTMLAttributes<HTMLTableRowElement> &
    DjotNodePropsBase<"row"> & {
      head: boolean;
    };
  cell: React.TdHTMLAttributes<HTMLTableCellElement> &
    Omit<DjotNodePropsBase<"cell">, "node"> & {
      align: DjotTableAlignment;
      head: boolean;
      node: DjotCellNode;
    };
  footnote_reference: React.AnchorHTMLAttributes<HTMLAnchorElement> &
    DjotNodePropsBase<"footnote_reference"> & {
      index: number;
      label: string;
    };
  footnote: React.LiHTMLAttributes<HTMLLIElement> &
    Omit<DjotNodePropsBase<"footnote">, "node"> & {
      index: number;
      label: string;
      node: DjotFootnoteNode;
    };
  endnotes: React.HTMLAttributes<HTMLElement> & {
    children?: React.ReactNode;
    node: DjotDocNode;
    order: string[];
  };
  double_quoted: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"double_quoted">;
  single_quoted: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"single_quoted">;
  smart_punctuation: DjotNodePropsBase<"smart_punctuation"> & {
    kind: DjotSmartPunctuationType;
    value: string;
  };
  inline_math: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"inline_math"> & {
      value: string;
    };
  display_math: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"display_math"> & {
      value: string;
    };
  code: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"code">, "node"> & {
      node: DjotCodeNode | DjotVerbatimNode;
      value: string;
    };
  verbatim: React.HTMLAttributes<HTMLElement> &
    Omit<DjotNodePropsBase<"verbatim">, "node"> & {
      node: DjotCodeNode | DjotVerbatimNode;
      value: string;
    };
  code_block: React.HTMLAttributes<HTMLPreElement> &
    DjotNodePropsBase<"code_block"> & {
      language?: string;
      value: string;
    };
  raw_block: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"raw_block"> & {
      format: string;
      value: string;
    };
  raw_inline: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"raw_inline"> & {
      format: string;
      value: string;
    };
  symb: React.HTMLAttributes<HTMLElement> &
    DjotNodePropsBase<"symb"> & {
      alias: string;
      value: string;
    };
  url: React.AnchorHTMLAttributes<HTMLAnchorElement> &
    DjotNodePropsBase<"url"> & {
      href: string;
      value: string;
    };
  email: React.AnchorHTMLAttributes<HTMLAnchorElement> &
    DjotNodePropsBase<"email"> & {
      href: string;
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
  definition_list: React.HTMLAttributes<HTMLDListElement> & DjotNodePropsBase<"definition_list">;
  definition_list_item: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"definition_list_item">;
  term: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"term">;
  definition: React.HTMLAttributes<HTMLElement> & DjotNodePropsBase<"definition">;
  task_list: React.HTMLAttributes<HTMLUListElement> &
    DjotNodePropsBase<"task_list"> & {
      tight?: boolean;
    };
  task_list_item: React.LiHTMLAttributes<HTMLLIElement> &
    DjotNodePropsBase<"task_list_item"> & {
      checkbox: DjotCheckboxStatus;
      tight?: boolean;
    };
  blockquote: React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
    Omit<DjotNodePropsBase<"blockquote">, "node"> & {
      node: DjotBlockquoteNode | DjotBlockQuoteNode;
    };
  block_quote: React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
    Omit<DjotNodePropsBase<"block_quote">, "node"> & {
      node: DjotBlockquoteNode | DjotBlockQuoteNode;
    };
  thematic_break: React.HTMLAttributes<HTMLHRElement> & DjotNodePropsBase<"thematic_break">;
  str: DjotNodePropsBase<"str"> & {
    value: string;
  };
  non_breaking_space: DjotNodePropsBase<"non_breaking_space"> & {
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

interface DjotSharedProps {
  components?: DjotComponents | undefined;
}

export type DjotProps =
  | (DjotSharedProps & {
      ast?: never;
      children?: string | null | undefined;
    })
  | (DjotSharedProps & {
      ast: DjotNode;
      children?: never;
    });
