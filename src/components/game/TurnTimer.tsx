import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface TurnTimerProps {
  isActive: boolean;
  duration: number; // in seconds
  onTimeout: () => void;
  turnNumber: number; // Used to reset timer on turn change
}

export function TurnTimer({ isActive, duration, onTimeout, turnNumber }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  // Reset timer when turn changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [turnNumber, duration]);
  
  // Countdown effect
  useEffect(() => {
    if (!isActive) return;
    
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
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
      isActive ? "bg-card/80" : "bg-card/40 opacity-50",
      isCritical && isActive && "animate-timer-pulse bg-destructive/20"
    )}>
      <Timer className={cn(
        "w-4 h-4",
        isCritical ? "text-destructive" : isLow ? "text-primary" : "text-muted-foreground"
      )} />
      
      <div className="flex flex-col gap-1 min-w-[60px]">
        <div className={cn(
          "text-sm font-mono font-bold",
          isCritical ? "text-destructive" : isLow ? "text-primary" : "text-foreground"
        )}>
          {timeLeft}s
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-linear rounded-full",
              isCritical ? "bg-destructive" : isLow ? "bg-primary" : "bg-muted-foreground"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
