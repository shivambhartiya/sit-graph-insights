"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const graphHandler = require("./api/graph");

const port = Number(process.env.PORT) || 3000;
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
]);

http
  .createServer(async (request, response) => {
    if (request.url === "/api/graph") {
      request.body = await readJsonBody(request);
      return graphHandler(request, adaptResponse(response));
    }

    const asset = publicFiles.get(request.url);
    if (!asset) {
      response.writeHead(404, { "Content-Type": "application/json" });
      return response.end(JSON.stringify({ error: "Not found" }));
    }

    const [filename, contentType] = asset;
    response.writeHead(200, { "Content-Type": contentType });
    return fs.createReadStream(path.join(__dirname, filename)).pipe(response);
  })
  .listen(port, () => console.log(`Graph Insights running at http://localhost:${port}`));

function readJsonBody(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
  });
}

function adaptResponse(response) {
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (value) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(value));
  };
  return response;
}
