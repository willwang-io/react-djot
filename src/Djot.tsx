import { parse } from "@djot/djot";
import { Fragment } from "react";
import type React from "react";
import { renderNode } from "./renderNode";
import type { DjotNode, DjotProps } from "./types";

export function Djot({ children, components }: DjotProps): React.ReactElement | null {
  const source = children ?? "";

  if (source.length === 0) {
    return null;
  }

  const ast = parse(source) as DjotNode;
  return <Fragment>{renderNode(ast, { components })}</Fragment>;
}

export default Djot;
