
import { db } from "./db";
import { games, type Game, type InsertGame } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  createOrJoinGame(playerId: string, forceNew?: boolean): Promise<{ game: Game, role: 'p1' | 'p2', message: string }>;
  getGame(id: number): Promise<Game | undefined>;
  clickNumber(gameId: number, playerId: string, number: number): Promise<Game>;
  deleteGame(id: number, playerId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createOrJoinGame(playerId: string, forceNew = false): Promise<{ game: Game, role: 'p1' | 'p2', message: string }> {
    if (!forceNew) {
      // Try to join an existing waiting game
      const [joinedGame] = await db
        .update(games)
        .set({ 
          player2Id: playerId, 
          status: 'playing' 
        })
        .where(and(eq(games.status, 'waiting'), isNull(games.player2Id)))
        .returning();

      if (joinedGame) {
        return { game: joinedGame, role: 'p2', message: 'Joined existing game' };
      }
      
      // If we are looking for a game but none found, we should throw an error or return null
      // The user wants "Find Game" to only find, not create.
      throw new Error("No waiting games found. Try creating a new one!");
    }

    // Grid-based placement (10x10)
    const grid: number[] = Array.from({ length: 100 }, (_, i) => i);
    // Shuffle grid positions
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }

    const positions: { value: number; x: number; y: number }[] = [];
    for (let i = 1; i <= 99; i++) {
      const gridIndex = grid[i - 1];
      const row = Math.floor(gridIndex / 10);
      const col = gridIndex % 10;
      
      // Random offset within the 10% cell, but keep centered-ish
      // Using 9x9 grid layout within the 100% space to keep items away from edges
      const x = (col * 9) + 5.5;
      const y = (row * 9) + 5.5;
      
      positions.push({ value: i, x, y });
    }

    const [newGame] = await db
      .insert(games)
      .values({
        player1Id: playerId,
        status: "waiting",
        positions,
        takenBy: {},
        currentTarget: 1,
        p1Score: 0,
        p2Score: 0,
        seed: Math.random().toString(36).substring(7)
      })
      .returning();

    return { game: newGame, role: 'p1', message: 'Created new game. Waiting for player 2...' };
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async clickNumber(gameId: number, playerId: string, number: number): Promise<Game> {
    // We need to fetch the game first to validate logic
    // In a real app we might use a transaction or more complex SQL to do this atomically
    // For this MVP, we'll fetch and then update if valid

    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== 'playing') {
      throw new Error("Game is not in playing state");
    }

    if (number !== game.currentTarget) {
      throw new Error("Wrong number clicked");
    }

    // Determine role
    let role: 'p1' | 'p2' | null = null;
    if (playerId === game.player1Id) role = 'p1';
    else if (playerId === game.player2Id) role = 'p2';

    if (!role) throw new Error("Player not in this game");

    // Check if already taken (should be covered by currentTarget check, but safe to check)
    // Actually currentTarget check is enough because we increment it.

    // Prepare updates
    const updates: Partial<InsertGame> = {
      currentTarget: game.currentTarget + 1,
      takenBy: { ...game.takenBy, [number]: role }
    };

    if (role === 'p1') updates.p1Score = game.p1Score + 1;
    else updates.p2Score = game.p2Score + 1;

    if (game.currentTarget === 99) {
      updates.status = 'finished';
    }

    // Optimistic concurrency control could be added here (where currentTarget = X)
    // to prevent double clicks if two requests come in exactly same time.
    const [updatedGame] = await db
      .update(games)
      .set(updates)
      .where(and(eq(games.id, gameId), eq(games.currentTarget, number))) // Ensure we only update if target hasn't changed
      .returning();

    if (!updatedGame) {
       // Someone else clicked it first? Return current state
       const current = await this.getGame(gameId);
       if (!current) throw new Error("Game not found");
       return current;
    }

    return updatedGame;
  }

  async deleteGame(id: number, playerId: string): Promise<boolean> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");

    // Only the game creator (player1) can delete the game while it's waiting
    if (game.player1Id !== playerId) {
      throw new Error("Only the game creator can cancel");
    }

    if (game.status !== 'waiting') {
      throw new Error("Cannot cancel a game that has already started");
    }

    await db.delete(games).where(eq(games.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
