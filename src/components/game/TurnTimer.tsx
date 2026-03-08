import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface TurnTimerProps {
  isActive: boolean;
  duration: number;
  onTimeout: () => void;
  turnNumber: number;
}

export function TurnTimer({ isActive, duration, onTimeout, turnNumber }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    setTimeLeft(duration);
  }, [turnNumber, duration]);
  
  useEffect(() => {
    if (!isActive) return;
    
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeout]);
  
  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
      isActive ? "bg-white shadow-sm" : "bg-white/50 opacity-50",
      isCritical && isActive && "animate-timer-pulse bg-red-50"
    )}>
      <Timer className={cn(
        "w-4 h-4",
        isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-500"
      )} />
      
      <div className="flex flex-col gap-1 min-w-[60px]">
        <div className={cn(
          "text-sm font-mono font-bold",
          isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-700"
        )}>
          {timeLeft}s
        </div>
        
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-linear rounded-full",
              isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-gray-400"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
