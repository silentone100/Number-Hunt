import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameNumberProps {
  value: number;
  x: number;
  y: number;
  status: "available" | "taken-p1" | "taken-p2" | "target" | "disabled";
  isHidden?: boolean;
  onClick: (value: number) => void;
}

export function GameNumber({ value, x, y, status, isHidden, onClick }: GameNumberProps) {
  const isTaken = status === "taken-p1" || status === "taken-p2";
  const isTarget = status === "target";
  const isDisabled = status === "disabled" || isTaken;

  return (
    <motion.button
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        zIndex: 1 
      }}
      whileHover={!isDisabled && !isHidden ? { scale: 1.1, zIndex: 40 } : {}}
      whileTap={!isDisabled && !isHidden ? { scale: 0.9 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        position: 'absolute',
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      className={cn(
        "absolute w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-md border-2 transition-colors cursor-pointer select-none",
        
        // Default available state
        status === "available" && !isHidden && "bg-white text-slate-700 border-slate-200",
        
        // Hidden state (?)
        isHidden && "bg-slate-100 text-slate-400 border-slate-200 cursor-default",

        // Taken by Player 1 (Red)
        status === "taken-p1" && "bg-red-500 text-white border-red-600 shadow-none",
        
        // Taken by Player 2 (Blue)
        status === "taken-p2" && "bg-blue-500 text-white border-blue-600 shadow-none"
      )}
      onClick={() => !isTaken && !isHidden && onClick(value)}
      disabled={isTaken || isHidden}
    >
      {isHidden ? "?" : value}
      
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
