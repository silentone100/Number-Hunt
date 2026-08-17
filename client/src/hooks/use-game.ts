import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type JoinGameRequest, type ClickNumberRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

// Helper to get or create a persistent Player ID
export const getPlayerId = () => {
  let id = localStorage.getItem("click_race_player_id");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("click_race_player_id", id);
  }
  return id;
};

// GET /api/games/:id
export function useGame(id: number | null) {
  return useQuery({
    queryKey: [api.games.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.games.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch game");
      
      return api.games.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: 500, // Poll every 500ms as requested
  });
}

// POST /api/games/join
export function useJoinGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (forceNew?: boolean) => {
      const playerId = getPlayerId();
      const payload: JoinGameRequest = { playerId, forceNew };
      
      const res = await fetch(api.games.join.path, {
        method: api.games.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to join game";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // fallback to generic error
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      return data as { game: any; role: "p1" | "p2"; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.games.get.path] });
    },
    onError: (error) => {
      toast({
        title: "Error joining game",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// DELETE /api/games/:id
export function useDeleteGame() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ gameId, playerId }: { gameId: number; playerId: string }) => {
      const url = buildUrl(api.games.delete.path, { id: gameId });

      const res = await fetch(url, {
        method: api.games.delete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to leave game";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // fallback
        }
        throw new Error(errorMessage);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.games.get.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// POST /api/games/:id/click
export function useClickNumber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ gameId, number }: { gameId: number; number: number }) => {
      const playerId = getPlayerId();
      const payload: ClickNumberRequest = { playerId, number };
      const url = buildUrl(api.games.click.path, { id: gameId });

      const res = await fetch(url, {
        method: api.games.click.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          // Conflict/Bad Request usually means clicked wrong number or taken
          // We can swallow this or show a subtle toast, usually in fast games we swallow
          throw new Error("Invalid move");
        }
        throw new Error("Failed to register click");
      }
      return api.games.click.responses[200].parse(await res.json());
    },
    onSuccess: (_, { gameId }) => {
      // Invalidate immediately to show update
      queryClient.invalidateQueries({ queryKey: [api.games.get.path, gameId] });
    },
    onError: (error) => {
      // Optional: don't disrupt flow for minor click errors
      console.error(error);
    }
  });
}
