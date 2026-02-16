import express from "express";
import {matchesRouter} from "./routes/matches.js";
import http from "http";
import { attachWebsocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
const app = express();
const PORT = Number(process.env.PORT) || 8000;
const HOST = String(process.env.HOST) || "0.0.0.0";
app.use(express.json());
const server = http.createServer(app);
app.get("/", (req, res) => {
  res.send("Hello! Express server is running 🚀");
});

app.use(securityMiddleware())
app.use('/matches', matchesRouter);

const { broadcastMatchCreated } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT,HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
  console.log(`Server started at: ${baseUrl}`);
  console.log(`WebSocket endpoint available at: ${baseUrl.replace("http", "ws")}/ws`);
});
