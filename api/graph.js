"use strict";

const { processGraph } = require("../graph");

module.exports = function graphHandler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed. Use POST /api/graph." });
  }

  if (!request.body || !Array.isArray(request.body.edges)) {
    return response.status(400).json({
      error: 'Invalid request body. Expected JSON in the form: {"edges":["A->B"]}.',
    });
  }

  return response.status(200).json(processGraph(request.body.edges));
};
