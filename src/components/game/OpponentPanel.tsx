import { PlayerState } from '@/types/game';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
        ? "bg-white border-red-500 shadow-lg shadow-red-500/20" 
        : "bg-white/90 border-gray-300",
      position === 'top' && "flex-col",
    )}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className={cn(
          "border-2",
          isCurrentTurn ? "border-red-500" : "border-gray-300"
        )}>
          <AvatarFallback className={cn(
            player.isBot ? 'bg-gray-100' : 'bg-red-50',
            'text-gray-700'
          )}>
            {player.isBot ? (
              <Bot className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </AvatarFallback>
        </Avatar>
        {isCurrentTurn && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Player info */}
      <div className={cn(
        "flex flex-col",
        position === 'top' && "items-center"
      )}>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate max-w-[100px] text-gray-900">
            {player.name}
          </span>
          {player.isBot && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-gray-200 text-gray-600 font-medium">
              BOT
            </span>
          )}
        </div>
        
        {/* Card count */}
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            "font-mono",
            player.hand.length === 0 ? "text-green-600 font-bold" : "text-gray-500"
          )}>
            {player.hand.length} cards
          </span>
          {player.specialCards.length > 0 && (
            <span className="text-red-600 font-medium">
              +{player.specialCards.length} special
            </span>
          )}
        </div>
      </div>
      
      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className={cn(
          "text-xs text-red-600 font-semibold",
          position === 'top' ? "order-first" : "ml-auto"
        )}>
          Playing...
        </div>
      )}
    </div>
  );
}
