
import { pgTable, text, serial, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game status
export type GameStatus = "waiting" | "playing" | "finished";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  status: text("status").$type<GameStatus>().notNull().default("waiting"),
  player1Id: text("player1_id"),
  player2Id: text("player2_id"),
  currentTarget: integer("current_target").notNull().default(1),
  p1Score: integer("p1_score").notNull().default(0),
  p2Score: integer("p2_score").notNull().default(0),
  // Store positions as [{value: 1, x: 10, y: 20}, ...] to ensure both players see same layout
  positions: json("positions").$type<Array<{value: number, x: number, y: number}>>().notNull(),
  // Map of number -> "p1" | "p2"
  takenBy: json("taken_by").$type<Record<string, "p1" | "p2">>().notNull().default({}),
});

export const insertGameSchema = createInsertSchema(games);

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

// API Payloads
export const joinGameSchema = z.object({
  playerId: z.string().min(1),
});

export const clickNumberSchema = z.object({
  playerId: z.string().min(1),
  number: z.number().int().min(1).max(99),
});

export type JoinGameRequest = z.infer<typeof joinGameSchema>;
export type ClickNumberRequest = z.infer<typeof clickNumberSchema>;
