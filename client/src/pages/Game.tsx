import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGame, useClickNumber, getPlayerId } from "@/hooks/use-game";
import { GameNumber } from "@/components/GameNumber";
import { PlayerStats } from "@/components/PlayerStats";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function Game() {
  const [, params] = useRoute("/game/:id");
  const [, setLocation] = useLocation();
  const gameId = params ? parseInt(params.id) : null;
  const playerId = getPlayerId();
  
  const { data: game, isLoading, error } = useGame(gameId);
  const clickNumber = useClickNumber();
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Determine user role and opponent
  const isP1 = game?.player1Id === playerId;
  const isP2 = game?.player2Id === playerId;
  const userRole = isP1 ? "p1" : isP2 ? "p2" : "spectator";
  
  // Confetti effect on win
  useEffect(() => {
    if (game?.status === "finished" && !hasCelebrated) {
      const isWinner = 
        (userRole === "p1" && game.p1Score > game.p2Score) ||
        (userRole === "p2" && game.p2Score > game.p1Score);
      
      if (isWinner) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: isP1 ? ['#ef4444', '#fecaca'] : ['#3b82f6', '#bfdbfe']
        });
      }
      setHasCelebrated(true);
    }
  }, [game?.status, game?.p1Score, game?.p2Score, userRole, hasCelebrated, isP1]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading game arena...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Game Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
          We couldn't load this game. It might not exist or has expired.
        </p>
        <Button onClick={() => setLocation("/")} size="lg">Return Home</Button>
      </div>
    );
  }

  const handleNumberClick = (num: number) => {
    if (game.status === "playing" && num === game.currentTarget) {
      clickNumber.mutate({ gameId: game.id, number: num });
    }
  };

  const winner = 
    game.p1Score > game.p2Score ? "Player 1" : 
    game.p2Score > game.p1Score ? "Player 2" : "Draw";
    
  const isGameOver = game.status === "finished";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Header / Stats */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-start">
            <div className="transform scale-75 md:scale-100 origin-left">
              <PlayerStats 
                label={isP1 ? "You" : "Player 1"} 
                score={game.p1Score} 
                color="red"
                isActive={userRole === "p1"}
                isWinner={isGameOver && game.p1Score > game.p2Score}
              />
            </div>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <div className="bg-slate-900 text-white px-6 py-2 rounded-xl shadow-lg mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center mb-1">
                Target
              </span>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={game.currentTarget}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-4xl font-black font-display block text-center min-w-[3ch]"
                >
                  {game.currentTarget <= 99 ? game.currentTarget : "DONE"}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">
              {game.status === "waiting" ? "Waiting for opponent..." : 
               game.status === "playing" ? "Game in progress" : "Game Over"}
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="transform scale-75 md:scale-100 origin-right">
              <PlayerStats 
                label={isP2 ? "You" : "Player 2"} 
                score={game.p2Score} 
                color="blue" 
                isActive={userRole === "p2"}
                isWinner={isGameOver && game.p2Score > game.p1Score}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative w-full max-w-5xl mx-auto p-4 md:p-8 h-[calc(100vh-140px)] min-h-[500px]">
        {/* Waiting State Overlay */}
        {game.status === "waiting" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 m-4">
            <div className="text-center p-8 bg-white shadow-2xl rounded-2xl border max-w-md mx-4 animate-in zoom-in duration-300">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Waiting for Opponent</h2>
              <p className="text-slate-500 mb-6">Share the URL or wait for someone to join.</p>
              <div className="bg-slate-100 p-3 rounded-lg font-mono text-sm break-all select-all cursor-pointer hover:bg-slate-200 transition-colors">
                {window.location.href}
              </div>
            </div>
          </div>
        )}
        
        {/* Game Canvas */}
        <div className="relative w-full h-full bg-white rounded-3xl shadow-sm border overflow-hidden">
          {/* Grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
               }} 
          />
          
          {game.positions.map((pos) => {
            const taken = game.takenBy[String(pos.value)];
            let status: "available" | "taken-p1" | "taken-p2" | "target" | "disabled" = "available";
            
            if (taken === "p1") status = "taken-p1";
            else if (taken === "p2") status = "taken-p2";
            else if (pos.value === game.currentTarget) status = "target";
            else if (pos.value > game.currentTarget) status = "disabled"; // Can't click future numbers
            // if pos.value < currentTarget but not taken, it's effectively disabled/skipped (shouldn't happen in valid state)
            
            return (
              <GameNumber
                key={pos.value}
                value={pos.value}
                x={pos.x}
                y={pos.y}
                status={status}
                onClick={handleNumberClick}
              />
            );
          })}
        </div>
      </main>

      {/* Game Over Overlay */}
      {game.status === "finished" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden">
            {/* Background flair */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-blue-500" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-6 drop-shadow-lg" />
              
              <h2 className="text-5xl font-display font-bold mb-2">
                {winner} Wins!
              </h2>
              
              <div className="flex justify-center gap-8 my-8">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">P1 Score</div>
                  <div className="text-4xl font-black text-red-500">{game.p1Score}</div>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">P2 Score</div>
                  <div className="text-4xl font-black text-blue-500">{game.p2Score}</div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/")} 
                  size="lg" 
                  className="w-full text-lg h-14 rounded-xl"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
