import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GameBoard() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const playerId = localStorage.getItem("playerId") || "";
  const role = localStorage.getItem(`role_${id}`) as "p1" | "p2" | null;

  const { data: game, isLoading, error } = useQuery({
    queryKey: [buildUrl(api.games.get.path, { id: id! })],
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.status === "finished" ? false : 500;
    },
  });

  const clickMutation = useMutation({
    mutationFn: async (number: number) => {
      const res = await apiRequest("POST", buildUrl(api.games.click.path, { id: id! }), {
        playerId,
        number,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.games.get.path, { id: id! })] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Too Slow!",
        description: err.message || "Someone else got it first!",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-600">Game not found or error occurred.</p>
        <Button onClick={() => setLocation("/")}>Go Back</Button>
      </div>
    );
  }

  const isPlayer1 = game.player1Id === playerId;
  const isPlayer2 = game.player2Id === playerId;
  const myRole = isPlayer1 ? "p1" : (isPlayer2 ? "p2" : role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => setLocation("/")} size="sm">
          <ArrowLeft className="mr-2 w-4 h-4" /> Exit
        </Button>
        
        <div className="flex gap-4 items-center bg-white p-2 px-4 rounded-full shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-bold text-slate-700">P1: {game.p1Score}</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-bold text-slate-700">P2: {game.p2Score}</span>
          </div>
        </div>

        <Badge variant="outline" className="h-8 px-4 font-mono text-lg bg-white">
          Target: <span className="text-primary ml-2 font-black">{game.currentTarget}</span>
        </Badge>
      </header>

      {/* Waiting Lobby */}
      {game.status === "waiting" && (
        <Card className="max-w-md mx-auto w-full p-8 text-center space-y-4 shadow-xl mt-20">
          <Users className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-800">Waiting for Player 2</h2>
          <p className="text-slate-500">The game will start automatically when someone joins.</p>
          <div className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded">
            Game ID: {game.id}
          </div>
        </Card>
      )}

      {/* Main Game Board */}
      {game.status !== "waiting" && (
        <div className="flex-1 relative max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-inner border-2 border-slate-200 overflow-hidden mb-8"
             style={{ minHeight: '600px' }}>
          
          <AnimatePresence>
            {game.positions.map((pos) => {
              const takenBy = game.takenBy[pos.value.toString()];
              const isCurrent = pos.value === game.currentTarget;
              const isTaken = !!takenBy;

              return (
                <motion.div
                  key={pos.value}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: pos.value * 0.005 }}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isCurrent ? 10 : 1
                  }}
                >
                  <Button
                    size="icon"
                    variant={isCurrent ? "default" : "outline"}
                    className={`
                      w-10 h-10 rounded-full text-xs font-bold transition-all relative
                      ${isTaken ? (takenBy === "p1" ? "border-red-500 bg-red-50 text-red-700" : "border-blue-500 bg-blue-50 text-blue-700") : ""}
                      ${isCurrent ? "scale-125 ring-4 ring-primary/20" : ""}
                      ${isTaken ? "opacity-40 grayscale-[0.5]" : ""}
                    `}
                    disabled={isTaken || !isCurrent || clickMutation.isPending}
                    onClick={() => isCurrent && clickMutation.mutate(pos.value)}
                    data-testid={`btn-number-${pos.value}`}
                  >
                    {pos.value}
                    {isTaken && (
                      <div className={`absolute inset-0 rounded-full border-4 ${takenBy === 'p1' ? 'border-red-500' : 'border-blue-500'}`} />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Game Over Overlay */}
          {game.status === "finished" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-8"
            >
              <Trophy className={`w-24 h-24 mb-4 ${
                (myRole === 'p1' && game.p1Score > game.p2Score) || (myRole === 'p2' && game.p2Score > game.p1Score)
                  ? 'text-yellow-500' : 'text-slate-400'
              }`} />
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {game.p1Score === game.p2Score ? "IT'S A TIE!" : 
                 ((myRole === 'p1' && game.p1Score > game.p2Score) || (myRole === 'p2' && game.p2Score > game.p1Score))
                  ? "YOU WON!" : "YOU LOST!"}
              </h2>
              <p className="text-slate-500 mb-8 text-xl">
                Final Score: {game.p1Score} - {game.p2Score}
              </p>
              <Button size="lg" onClick={() => setLocation("/")} className="px-12 font-bold">
                Play Again
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
