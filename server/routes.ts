
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.games.join.path, async (req, res) => {
    try {
      const { playerId } = api.games.join.input.parse(req.body);
      const result = await storage.createOrJoinGame(playerId);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  app.get(api.games.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
      
      const game = await storage.getGame(id);
      if (!game) return res.status(404).json({ message: "Game not found" });
      
      res.json(game);
    } catch (e) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.games.click.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
      
      const { playerId, number } = api.games.click.input.parse(req.body);
      
      const game = await storage.clickNumber(id, playerId, number);
      res.json(game);
    } catch (e: any) {
      // Handle "Too slow" or logic errors as 400
      if (e.message.includes("Too slow") || e.message.includes("Wrong number")) {
         return res.status(400).json({ message: e.message });
      }
      if (e.message.includes("not found")) {
         return res.status(404).json({ message: e.message });
      }
      console.error(e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  return httpServer;
}
