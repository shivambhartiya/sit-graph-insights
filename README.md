# Graph Hierarchy Analyzer

A Node.js solution for the SIT Round 1 engineering challenge. It includes the required graph-processing API and a simple frontend.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## API

`POST /api/graph`

```json
{
  "edges": ["A->B", "A->C", "B->D"]
}
```

The API validates entries, removes duplicate edges, applies first-parent-wins behavior, detects cycles, builds nested trees, calculates depth, and returns a summary. CORS is enabled for external evaluators.

## Test

```bash
npm test
```

The implementation uses only Node.js built-ins. Graph processing runs in O(V + E) time.
