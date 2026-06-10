"use strict";

const IDENTITY = Object.freeze({
  user_id: "shivambhartiya_20040131",
  email_id: "shivam.bhartiya.btech2023@sitpune.edu.in",
  enrollment_number: "23070122203",
});

const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

function processGraph(input) {
  const edges = Array.isArray(input) ? input : [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateSet = new Set();
  const seenEdges = new Set();
  const uniqueEdges = [];

  for (const entry of edges) {
    const normalized = typeof entry === "string" ? entry.trim() : "";

    if (!EDGE_PATTERN.test(normalized) || normalized[0] === normalized[3]) {
      invalidEntries.push(typeof entry === "string" ? normalized : String(entry ?? ""));
      continue;
    }

    if (seenEdges.has(normalized)) {
      if (!duplicateSet.has(normalized)) {
        duplicateEdges.push(normalized);
        duplicateSet.add(normalized);
      }
      continue;
    }

    seenEdges.add(normalized);
    uniqueEdges.push([normalized[0], normalized[3]]);
  }

  const nodes = [];
  const nodeSet = new Set();
  const registerNode = (node) => {
    if (!nodeSet.has(node)) {
      nodeSet.add(node);
      nodes.push(node);
    }
  };

  const parentOf = new Map();
  const acceptedEdges = [];

  for (const [parent, child] of uniqueEdges) {
    if (parentOf.has(child)) continue;

    registerNode(parent);
    registerNode(child);
    parentOf.set(child, parent);
    acceptedEdges.push([parent, child]);
  }

  const children = new Map(nodes.map((node) => [node, []]));
  const neighbors = new Map(nodes.map((node) => [node, []]));

  for (const [parent, child] of acceptedEdges) {
    children.get(parent).push(child);
    neighbors.get(parent).push(child);
    neighbors.get(child).push(parent);
  }

  const components = collectComponents(nodes, neighbors);
  const hierarchies = components.map((component) =>
    createHierarchy(component, children, parentOf),
  );

  const trees = hierarchies.filter((hierarchy) => !hierarchy.has_cycle);
  const largestTree = trees.reduce((largest, current) => {
    if (!largest || current.depth > largest.depth) return current;
    if (current.depth === largest.depth && current.root < largest.root) return current;
    return largest;
  }, null);

  return {
    ...IDENTITY,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: trees.length,
      total_cycles: hierarchies.length - trees.length,
      largest_tree_root: largestTree?.root ?? "",
    },
  };
}

function collectComponents(nodes, neighbors) {
  const visited = new Set();
  const components = [];

  for (const start of nodes) {
    if (visited.has(start)) continue;

    const component = [];
    const queue = [start];
    visited.add(start);

    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      component.push(node);

      for (const neighbor of neighbors.get(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

function createHierarchy(component, children, parentOf) {
  const componentSet = new Set(component);
  const visiting = new Set();
  const complete = new Set();
  const hasCycle = component.some((node) =>
    reachesCycle(node, children, componentSet, visiting, complete),
  );

  if (hasCycle) {
    return {
      root: [...component].sort()[0],
      tree: {},
      has_cycle: true,
    };
  }

  const root = component.find((node) => !parentOf.has(node));
  return {
    root,
    tree: buildTree(root, children),
    depth: calculateDepth(root, children),
  };
}

function reachesCycle(node, children, component, visiting, complete) {
  if (visiting.has(node)) return true;
  if (complete.has(node)) return false;

  visiting.add(node);
  for (const child of children.get(node)) {
    if (component.has(child) && reachesCycle(child, children, component, visiting, complete)) {
      return true;
    }
  }
  visiting.delete(node);
  complete.add(node);
  return false;
}

function buildTree(node, children) {
  const branches = {};
  for (const child of children.get(node)) {
    Object.assign(branches, buildTree(child, children));
  }
  return { [node]: branches };
}

function calculateDepth(node, children) {
  const descendants = children.get(node);
  if (descendants.length === 0) return 1;
  return 1 + Math.max(...descendants.map((child) => calculateDepth(child, children)));
}

module.exports = { IDENTITY, processGraph };
