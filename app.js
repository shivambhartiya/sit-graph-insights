"use strict";

const exampleEdges = [
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R",
  "G->H", "G->H", "G->I", "hello", "1->2", "A->",
];

const form = document.querySelector("#graph-form");
const input = document.querySelector("#edges");
const count = document.querySelector("#edge-count");
const error = document.querySelector("#error");
const status = document.querySelector("#status");
const emptyState = document.querySelector("#empty-state");
const results = document.querySelector("#results");

document.querySelector("#load-example").addEventListener("click", () => {
  input.value = exampleEdges.join("\n");
  updateCount();
});

input.addEventListener("input", updateCount);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  status.textContent = "Loading...";

  try {
    const response = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edges: parseEdges(input.value) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");

    showResult(data);
    status.textContent = "Complete";
  } catch (requestError) {
    error.textContent = requestError.message;
    status.textContent = "Error";
  }
});

function parseEdges(value) {
  if (!value.trim()) return [];
  return value.split(/[\n,]/).map((edge) => edge.trim());
}

function updateCount() {
  const total = parseEdges(input.value).length;
  count.textContent = `${total} ${total === 1 ? "entry" : "entries"}`;
}

function showResult(data) {
  const hierarchies = data.hierarchies.map((hierarchy) => {
    const detail = hierarchy.has_cycle
      ? '<span class="cycle">Cycle detected</span>'
      : `Depth: ${hierarchy.depth}`;

    return `
      <div class="hierarchy">
        <h3>Root: ${escapeHtml(hierarchy.root)} (${detail})</h3>
        <pre>${escapeHtml(JSON.stringify(hierarchy.tree, null, 2))}</pre>
      </div>
    `;
  }).join("");

  results.innerHTML = `
    <h3>Summary</h3>
    <ul class="summary">
      <li>Valid trees: ${data.summary.total_trees}</li>
      <li>Cyclic groups: ${data.summary.total_cycles}</li>
      <li>Largest tree root: ${escapeHtml(data.summary.largest_tree_root || "None")}</li>
      <li>Invalid entries: ${formatList(data.invalid_entries)}</li>
      <li>Duplicate edges: ${formatList(data.duplicate_edges)}</li>
    </ul>
    <h3>Hierarchies</h3>
    ${hierarchies || "<p>No valid graph nodes found.</p>"}
  `;

  emptyState.hidden = true;
  results.hidden = false;
}

function formatList(values) {
  return values.length ? values.map((value) => escapeHtml(String(value))).join(", ") : "None";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}
