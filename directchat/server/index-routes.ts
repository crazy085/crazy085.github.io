import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          userId = message.userId;
          if (userId) {
            clients.set(userId, ws);
          }
        } else if (message.type === "message") {
          const validatedMessage = insertMessageSchema.parse({
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
          });

          const savedMessage = await storage.createMessage(validatedMessage);

          if (clients.has(message.senderId)) {
            clients.get(message.senderId)?.send(
              JSON.stringify({ type: "message", message: savedMessage })
            );
          }

          if (clients.has(message.receiverId)) {
            clients.get(message.receiverId)?.send(
              JSON.stringify({ type: "message", message: savedMessage })
            );
          }
        } else if (message.type === "getHistory") {
          const messages = await storage.getMessagesBetweenUsers(
            message.userId,
            message.contactId
          );

          ws.send(JSON.stringify({ type: "history", messages }));
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser({ username, password });
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/messages/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const messages = await storage.getMessagesBetweenUsers(userId, contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  return httpServer;
}
