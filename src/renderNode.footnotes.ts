import { cloneElement, isValidElement } from "react";
import type React from "react";
import type {
  DjotBaseNode,
  DjotDocNode,
  DjotImageNode,
  DjotLinkNode,
  DjotNode,
  DjotParentNode,
  DjotReferenceNode
} from "./types";

export interface FootnoteState {
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

export function createFootnoteState(node: DjotDocNode): FootnoteState {
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

export function resolveReferenceNode(
  node: Pick<DjotLinkNode, "reference"> | Pick<DjotImageNode, "reference">,
  footnoteState: FootnoteState | undefined
): DjotReferenceNode | undefined {
  if (!node.reference || !footnoteState) {
    return undefined;
  }

  return footnoteState.referencesByLabel[node.reference] ?? footnoteState.autoReferencesByLabel[node.reference];
}

export function resolveReferenceDestination(
  node: Pick<DjotLinkNode, "destination" | "reference"> | Pick<DjotImageNode, "destination" | "reference">,
  footnoteState: FootnoteState | undefined
): string | undefined {
  if (node.destination) {
    return node.destination;
  }

  return resolveReferenceNode(node, footnoteState)?.destination;
}

export function ensureFootnoteIndex(label: string, footnoteState: FootnoteState): number {
  const existing = footnoteState.indexByLabel.get(label);
  if (existing) {
    return existing;
  }

  const index = footnoteState.order.length + 1;
  footnoteState.indexByLabel.set(label, index);
  footnoteState.order.push(label);
  return index;
}

export function appendBacklink(nodes: React.ReactNode[], backlink: React.ReactNode): React.ReactNode[] {
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
