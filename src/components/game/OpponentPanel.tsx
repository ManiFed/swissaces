import { PlayerState } from '@/types/game';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpponentPanelProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
}

export function OpponentPanel({ player, isCurrentTurn, position }: OpponentPanelProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all border",
      isCurrentTurn 
        ? "bg-primary/10 border-primary shadow-glow" 
        : "bg-card/80 border-border/50",
      position === 'top' && "flex-col",
    )}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className={cn(
          "border-2",
          isCurrentTurn ? "border-primary" : "border-border"
        )}>
          <AvatarFallback className={cn(
            player.isBot ? 'bg-secondary' : 'bg-primary/10',
            'text-foreground'
          )}>
            {player.isBot ? (
              <Bot className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </AvatarFallback>
        </Avatar>
        {isCurrentTurn && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Player info */}
      <div className={cn(
        "flex flex-col",
        position === 'top' && "items-center"
      )}>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate max-w-[100px] text-card-foreground">
            {player.name}
          </span>
          {player.isBot && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground">
              BOT
            </Badge>
          )}
        </div>
        
        {/* Card count */}
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            "font-mono",
            player.hand.length === 0 ? "text-green-600 font-bold" : "text-muted-foreground"
          )}>
            {player.hand.length} cards
          </span>
          {player.specialCards.length > 0 && (
            <span className="text-primary font-medium">
              +{player.specialCards.length} special
            </span>
          )}
        </div>
      </div>
      
      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className={cn(
          "text-xs text-primary font-semibold",
          position === 'top' ? "order-first" : "ml-auto"
        )}>
          Playing...
        </div>
      )}
    </div>
  );
}
