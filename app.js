"use strict";

const example = [
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
const submitButton = form.querySelector("button[type='submit']");

document.querySelector("#load-example").addEventListener("click", () => {
  input.value = example.join("\n");
  updateCount();
  input.focus();
});

input.addEventListener("input", updateCount);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  status.textContent = "Analyzing";
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edges: parseEntries(input.value) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The API request failed.");
    renderResults(data);
    status.textContent = "Complete";
  } catch (requestError) {
    error.textContent = requestError.message;
    status.textContent = "Error";
  } finally {
    submitButton.disabled = false;
  }
});

function parseEntries(value) {
  if (!value.trim()) return [];
  return value.split(/[\n,]/).map((entry) => entry.trim());
}

function updateCount() {
  const total = parseEntries(input.value).length;
  count.textContent = `${total} ${total === 1 ? "entry" : "entries"}`;
}

function renderResults(data) {
  const hierarchyCards = data.hierarchies.map((hierarchy) => `
    <article class="hierarchy-card">
      <div class="card-top">
        <div class="root"><span class="root-mark">${escapeHtml(hierarchy.root)}</span> Root ${escapeHtml(hierarchy.root)}</div>
        <span class="badge ${hierarchy.has_cycle ? "cycle" : ""}">
          ${hierarchy.has_cycle ? "Cycle detected" : `Depth ${hierarchy.depth}`}
        </span>
      </div>
      <pre>${escapeHtml(JSON.stringify(hierarchy.tree, null, 2))}</pre>
    </article>
  `).join("");

  results.innerHTML = `
    <div class="summary-grid">
      ${metric("Valid trees", data.summary.total_trees)}
      ${metric("Cyclic groups", data.summary.total_cycles)}
      ${metric("Largest root", data.summary.largest_tree_root || "—")}
    </div>
    <p class="result-title">Hierarchies</p>
    <div class="hierarchy-list">${hierarchyCards || '<div class="notice">No valid graph nodes found.</div>'}</div>
    <p class="result-title">Input checks</p>
    <div class="notice-grid">
      <div class="notice"><strong>Invalid entries (${data.invalid_entries.length})</strong>${list(data.invalid_entries)}</div>
      <div class="notice"><strong>Duplicate edges (${data.duplicate_edges.length})</strong>${list(data.duplicate_edges)}</div>
    </div>
  `;
  emptyState.hidden = true;
  results.hidden = false;
}

function metric(label, value) {
  return `<div class="metric"><small>${label}</small><strong>${escapeHtml(String(value))}</strong></div>`;
}

function list(values) {
  return values.length ? values.map((value) => escapeHtml(String(value))).join(", ") : "None";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}
