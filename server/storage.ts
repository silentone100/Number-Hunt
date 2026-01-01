
import { db } from "./db";
import { games, type Game, type InsertGame } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  createOrJoinGame(playerId: string): Promise<{ game: Game, role: 'p1' | 'p2', message: string }>;
  getGame(id: number): Promise<Game | undefined>;
  clickNumber(gameId: number, playerId: string, number: number): Promise<Game>;
}

export class DatabaseStorage implements IStorage {
  async createOrJoinGame(playerId: string): Promise<{ game: Game, role: 'p1' | 'p2', message: string }> {
    // Try to join an existing waiting game
    // Atomic update to prevent race conditions
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

    // No game found, create a new one
    const positions = Array.from({ length: 99 }, (_, i) => ({
      value: i + 1,
      x: Math.floor(Math.random() * 90) + 5, // 5-95%
      y: Math.floor(Math.random() * 85) + 10  // 10-95% (leave room for header)
    }));

    const [newGame] = await db
      .insert(games)
      .values({
        player1Id: playerId,
        status: 'waiting',
        positions,
        takenBy: {},
        currentTarget: 1,
        p1Score: 0,
        p2Score: 0
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
       // Someone else clicked it first?
       throw new Error("Too slow! Number already taken.");
    }

    return updatedGame;
  }
}

export const storage = new DatabaseStorage();
