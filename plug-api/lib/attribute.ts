import {
  findNodeOfType,
  ParseTree,
  replaceNodesMatchingAsync,
} from "$sb/lib/tree.ts";

import { YAML } from "$sb/plugos-syscall/mod.ts";

export type Attribute = {
  name: string;
  value: string;
};

/**
 * Extracts attributes from a tree, optionally cleaning them out of the tree.
 * @param tree tree to extract attributes from
 * @param clean whether or not to clean out the attributes from the tree
 * @returns mapping from attribute name to attribute value
 */
export async function extractAttributes(
  tree: ParseTree,
  clean: boolean,
): Promise<Record<string, any>> {
  const attributes: Record<string, any> = {};
  await replaceNodesMatchingAsync(tree, async (n) => {
    if (n.type === "ListItem") {
      // Find top-level only, no nested lists
      return n;
    }
    if (n.type === "Attribute") {
      const nameNode = findNodeOfType(n, "AttributeName");
      const valueNode = findNodeOfType(n, "AttributeValue");
      if (nameNode && valueNode) {
        const name = nameNode.children![0].text!;
        const val = valueNode.children![0].text!;
        try {
          attributes[name] = await YAML.parse(val);
        } catch (e: any) {
          console.error("Error parsing attribute value as YAML", val, e);
        }
      }
      // Remove from tree
      if (clean) {
        return null;
      } else {
        return n;
      }
    }
    // Go on...
    return undefined;
  });
  return attributes;
}