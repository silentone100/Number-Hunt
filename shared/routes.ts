
import { z } from 'zod';
import { games, joinGameSchema, clickNumberSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
};

export const api = {
  games: {
    join: {
      method: 'POST' as const,
      path: '/api/games/join',
      input: joinGameSchema,
      responses: {
        200: z.object({
          gameId: z.number(),
          role: z.enum(['p1', 'p2']),
          message: z.string()
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/games/:id',
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    click: {
      method: 'POST' as const,
      path: '/api/games/:id/click',
      input: clickNumberSchema,
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        400: errorSchemas.conflict, // If number already taken or not current target
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type helpers — Infer types from schemas
export type JoinGameRequest = z.infer<typeof api.games.join.input>;
export type ClickNumberRequest = z.infer<typeof api.games.click.input>;

export type NoteInput = any; // Dummy to avoid build errors if referenced elsewhere
export type NoteResponse = any;
export type NoteUpdateInput = any;
export type NotesListResponse = any;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = any;
