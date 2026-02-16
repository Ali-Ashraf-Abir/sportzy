import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";


const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;
    subscribers.delete(socket);
    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers || subscribers.size === 0) return;
    const message = JSON.stringify(payload);
    for (const client of subscribers) {
        if (client.readyState !== WebSocket.OPEN) continue;
        client.send(message)

    }
}
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());

    } catch (err) {
        sendJson(socket, { type: "error", message: "Invalid JSON message" });
        return;
    }
    if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: "subscribed", matchId: message.matchId });
    }

    if (message.type === "unsubscribe") {
        if (Number.isInteger(message.matchId)) {
            unsubscribe(message.matchId, socket);
            socket.subscriptions.delete(message.matchId);
            sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
        }
    }
}
export function attachWebsocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024, // 1MB
    });


    wss.on("connection", async (socket, req) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit()
                        ? "Rate limit exceeded"
                        : "Forbidden";

                    socket.close(code, reason);
                    return;
                }
            } catch (err) {
                console.error("ws connection error", err);
                socket.close(1011, "Server security error");
                return;
            }
        }

        socket.isAlive = true;
        socket.on("pong", () => (socket.isAlive = true));
        socket.subscriptions = new Set();

        socket.on("message", (data) => handleMessage(socket, data));
        socket.on("error", () => {
            socket.terminate();
        })
        socket.on("close", () => {
            cleanupSubscriptions(socket);
        })
        sendJson(socket, {
            type: "welcome",
            message: "Welcome to the Sports Live WebSocket server!",
        });

        socket.on("error", console.error);
    });


    const interval = setInterval(() => {
        wss.clients.forEach((socket) => {
            if (!socket.isAlive) {
                socket.terminate();
            } else {
                socket.isAlive = false;
                socket.ping();
            }
        });
    }, 30000);

    wss.on("close", () => {
        clearInterval(interval);
    });

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: "match_created", data: match });
    }
    function broadcastCommentary(commentary) {
        broadcastToMatch(commentary.matchId, { type: "commentary", data: commentary });
    }
    return {
        broadcastMatchCreated,
        broadcastCommentary
    }
}