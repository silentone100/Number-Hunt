import { useState } from "react";
import { useLocation } from "wouter";
import { useJoinGame } from "@/hooks/use-game";
import { motion } from "framer-motion";
import { Loader2, Play, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const joinGame = useJoinGame();
  const [isCreating, setIsCreating] = useState(false);

  const handlePlay = async () => {
    try {
      setIsCreating(true);
      const data = await joinGame.mutateAsync();
      setLocation(`/game/${data.gameId}`);
    } catch (e) {
      setIsCreating(false);
      // Toast handled in hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative background elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-red-100 opacity-50 blur-xl"
      />
      <motion.div 
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[10%] w-48 h-48 rounded-full bg-blue-100 opacity-50 blur-xl"
      />

      <div className="max-w-md w-full relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 relative inline-block">
            <h1 className="text-7xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-600 drop-shadow-sm">
              99
            </h1>
            <motion.div 
              animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -right-8 -top-4 text-red-500 transform rotate-12"
            >
              <MousePointer2 className="w-12 h-12 fill-current" />
            </motion.div>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Choose The Number
          </h2>
          <p className="text-slate-500 mb-10 text-lg">
            Race against an opponent to find numbers 1-99 in order. Speed and precision win!
          </p>

          <Button
            size="lg"
            onClick={handlePlay}
            disabled={isCreating}
            className="
              text-xl px-12 py-8 rounded-2xl font-display tracking-wide
              bg-gradient-to-r from-indigo-600 to-violet-600 
              hover:from-indigo-500 hover:to-violet-500
              shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40
              hover:-translate-y-1 active:translate-y-0 transition-all duration-200
            "
          >
            {isCreating ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Finding Match...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3 fill-current" />
                Find Game
              </>
            )}
          </Button>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Click Fast</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Be Accurate</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
