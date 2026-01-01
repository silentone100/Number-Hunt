import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("playerId");
    if (!id) {
      id = Math.random().toString(36).substring(7);
      localStorage.setItem("playerId", id);
    }
    setPlayerId(id);
  }, []);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.games.join.path, { playerId });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem(`role_${data.gameId}`, data.role);
      setLocation(`/game/${data.gameId}`);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            Choose the Number
          </CardTitle>
          <p className="text-slate-500">
            Race to find and click the lowest numbers first!
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-slate-100 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-700">How to Play:</h3>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>Join a game with another player</li>
              <li>Find the lowest available number (starts at 1)</li>
              <li>Click it before your opponent does!</li>
              <li>The player with most numbers wins</li>
            </ul>
          </div>
          
          <Button 
            className="w-full h-12 text-lg font-bold transition-all hover-elevate active-elevate-2"
            size="lg"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            data-testid="button-find-game"
          >
            {joinMutation.isPending ? "Finding Opponent..." : "Find Game"}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Your Player ID: <span className="font-mono">{playerId}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
