import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameNumberProps {
  value: number;
  x: number;
  y: number;
  status: "available" | "taken-p1" | "taken-p2" | "target" | "disabled";
  onClick: (value: number) => void;
}

export function GameNumber({ value, x, y, status, onClick }: GameNumberProps) {
  const isTaken = status === "taken-p1" || status === "taken-p2";
  const isTarget = status === "target";
  const isDisabled = status === "disabled" || isTaken;

  return (
    <motion.button
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isTarget ? 1.2 : 1, 
        opacity: 1,
        zIndex: isTarget ? 50 : 1 
      }}
      whileHover={!isDisabled ? { scale: 1.1, zIndex: 40 } : {}}
      whileTap={!isDisabled ? { scale: 0.9 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
      }}
      className={cn(
        "absolute w-10 h-10 md:w-12 md:h-12 -ml-5 -mt-5 md:-ml-6 md:-mt-6 rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-md border-2 transition-colors cursor-pointer select-none",
        
        // Default available state
        status === "available" && "bg-white text-slate-700 border-slate-200 hover:border-slate-400",
        
        // Next target state (Highlighted)
        status === "target" && "bg-yellow-400 text-yellow-950 border-yellow-600 shadow-xl shadow-yellow-400/30 ring-4 ring-yellow-400/20",
        
        // Disabled (future numbers)
        status === "disabled" && "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed",
        
        // Taken by Player 1 (Red)
        status === "taken-p1" && "bg-red-100 text-red-700 border-red-500 shadow-none ring-2 ring-red-500/30",
        
        // Taken by Player 2 (Blue)
        status === "taken-p2" && "bg-blue-100 text-blue-700 border-blue-500 shadow-none ring-2 ring-blue-500/30"
      )}
      onClick={() => !isDisabled && onClick(value)}
      disabled={isDisabled}
    >
      {value}
      
      {/* Taken Indicator Ring Animation */}
      <AnimatePresence>
        {isTaken && (
          <motion.div
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "absolute inset-0 rounded-full border-4 opacity-50",
              status === "taken-p1" ? "border-red-500" : "border-blue-500"
            )}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
