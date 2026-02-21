import { parse } from "@djot/djot";
import { Fragment } from "react";
import type React from "react";
import { renderNode } from "./renderNode";
import type { DjotNode, DjotProps } from "./types";

const COMPILE_CACHE_LIMIT = 100;
const compileCache = new Map<string, DjotNode>();

function getCachedAst(source: string): DjotNode | undefined {
  const cached = compileCache.get(source);

  if (!cached) {
    return undefined;
  }

  // Refresh cache recency on read.
  compileCache.delete(source);
  compileCache.set(source, cached);
  return cached;
}

function setCachedAst(source: string, ast: DjotNode): DjotNode {
  compileCache.set(source, ast);

  if (compileCache.size > COMPILE_CACHE_LIMIT) {
    const oldestSource = compileCache.keys().next().value;

    if (oldestSource !== undefined) {
      compileCache.delete(oldestSource);
    }
  }

  return ast;
}

export function compileDjot(source: string): DjotNode {
  const cached = getCachedAst(source);

  if (cached) {
    return cached;
  }

  const ast = parse(source) as DjotNode;
  return setCachedAst(source, ast);
}

export function Djot(props: DjotProps): React.ReactElement | null {
  const { components } = props;
  const astFromProps = props.ast;

  if (astFromProps !== undefined) {
    return <Fragment>{renderNode(astFromProps, { components })}</Fragment>;
  }

  const source = props.children ?? "";

  if (source.length === 0) {
    return null;
  }

  const ast = compileDjot(source);
  return <Fragment>{renderNode(ast, { components })}</Fragment>;
}

export default Djot;
