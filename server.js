const express = require("express");
const next = require("next");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const compression = require("compression"); // Added compression import

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Next.js configuration
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();
  server.use(cors());
  server.use(express.json());
  server.use(compression()); // Added compression middleware

  // Database Initialization Placeholder
  // require("./src/server/database/schema");

  // Cron Jobs Placeholder
  // require("./src/server/controllers/nudgeController");

  // Express API Routes
  server.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  server.get("/api/news", async (req, res) => {
    res.set('Cache-Control', 'no-cache');
    const { fetchNews } = require("./src/server/services/newsService");
    const news = await fetchNews();
    res.json(news);
  });

  // Fallback -> Todas as outras rotas (Frontend) vão para o Next.js
  server.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = http.createServer(server);

  // WebSocket Server setup na mesma porta (compartilhando http.createServer)
  const wss = new WebSocket.Server({ server: httpServer, path: "/api/gemini-ws" });
  
  require("./src/server/services/geminiSocketService")(wss);

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Express API mounted at /api/*`);
    console.log(`> WebSocket server mounted at ws://${hostname}:${port}/api/gemini-ws`);
  });
});
