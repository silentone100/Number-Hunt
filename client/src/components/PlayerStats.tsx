import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, User } from "lucide-react";

interface PlayerStatsProps {
  label: string;
  score: number;
  color: "red" | "blue";
  isActive?: boolean;
  isWinner?: boolean;
}

export function PlayerStats({ label, score, color, isActive, isWinner }: PlayerStatsProps) {
  const isRed = color === "red";
  
  return (
    <motion.div 
      animate={{ 
        scale: isActive ? 1.05 : 1,
        y: isActive ? -5 : 0
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 md:p-6 border-2 transition-colors",
        isRed 
          ? "bg-white border-red-100 shadow-lg shadow-red-500/10" 
          : "bg-white border-blue-100 shadow-lg shadow-blue-500/10",
        isActive && (isRed ? "border-red-500 ring-2 ring-red-500/20" : "border-blue-500 ring-2 ring-blue-500/20")
      )}
    >
      {/* Background decoration */}
      <div className={cn(
        "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10",
        isRed ? "bg-red-500" : "bg-blue-500"
      )} />

      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className={cn(
          "p-2 rounded-lg",
          isRed ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
        )}>
          {isWinner ? <Trophy className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <h3 className="font-display text-xl uppercase tracking-wider text-slate-700">
          {label}
        </h3>
      </div>
      
      <div className="flex items-baseline gap-2 relative z-10">
        <motion.span 
          key={score}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "text-4xl md:text-5xl font-black font-display",
            isRed ? "text-red-500" : "text-blue-500"
          )}
        >
          {score}
        </motion.span>
        <span className="text-sm font-medium text-slate-400 uppercase">Points</span>
      </div>

      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1",
            isRed ? "bg-red-500" : "bg-blue-500"
          )}
        />
      )}
    </motion.div>
  );
}
