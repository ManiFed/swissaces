import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PlayingCardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  faceDown?: boolean;
  isJoker?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const sizes = {
  xs: { 
    card: 'w-10 h-14', 
    rankTop: 'text-[10px]', 
    suitTop: 'text-[8px]',
    center: 'text-lg',
    padding: 'p-1'
  },
  sm: { 
    card: 'w-12 h-[68px]', 
    rankTop: 'text-xs', 
    suitTop: 'text-[10px]',
    center: 'text-xl',
    padding: 'p-1'
  },
  md: { 
    card: 'w-16 h-[88px]', 
    rankTop: 'text-sm', 
    suitTop: 'text-xs',
    center: 'text-2xl',
    padding: 'p-1.5'
  },
  lg: { 
    card: 'w-20 h-28', 
    rankTop: 'text-base', 
    suitTop: 'text-sm',
    center: 'text-3xl',
    padding: 'p-2'
  },
};

export function PlayingCard({ 
  suit = 'spades', 
  rank = 'A', 
  faceDown = false,
  isJoker = false,
  size = 'md',
  selected = false,
  disabled = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  className 
}: PlayingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sizeConfig = sizes[size];
  const isRed = suit === 'hearts' || suit === 'diamonds';

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable || disabled) return;
    setIsDragging(true);
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  // Card back
  if (faceDown) {
    return (
      <div 
        className={cn(
          'rounded-lg border-2 border-red-700 overflow-hidden',
          'flex items-center justify-center flex-shrink-0',
          'shadow-md transition-all duration-200 bg-red-600',
          sizeConfig.card,
          onClick && !disabled && 'cursor-pointer hover:scale-105',
          className
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="w-[85%] h-[85%] rounded border border-red-400/40 bg-red-500/30 flex items-center justify-center">
          <div className="text-red-200/60 font-serif text-lg font-bold">+</div>
        </div>
      </div>
    );
  }

  // Joker card
  if (isJoker) {
    return (
      <div 
        className={cn(
          'rounded-lg border-2 transition-all duration-200 flex-shrink-0 overflow-hidden',
          'flex flex-col justify-center items-center',
          'shadow-md bg-amber-50',
          sizeConfig.card,
          selected ? 'border-blue-500 ring-2 ring-blue-400/50 -translate-y-2' : 'border-amber-300',
          onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
          disabled && 'opacity-50 cursor-not-allowed',
          isDragging && 'opacity-50 scale-105',
          className
        )}
        draggable={draggable && !disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={!disabled ? onClick : undefined}
      >
        <span className={cn(sizeConfig.center, 'text-amber-500')}>★</span>
        <span className={cn(sizeConfig.rankTop, 'font-bold text-amber-600')}>JOKER</span>
      </div>
    );
  }

  // Regular playing card
  return (
    <div 
      className={cn(
        'rounded-lg border-2 transition-all duration-200 flex-shrink-0 overflow-hidden',
        'flex flex-col justify-between',
        'shadow-md bg-white',
        sizeConfig.card,
        sizeConfig.padding,
        selected ? 'border-blue-500 ring-2 ring-blue-400/50 -translate-y-2' : 'border-gray-300',
        onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
        disabled && 'opacity-50 cursor-not-allowed',
        isDragging && 'opacity-50 scale-105',
        className
      )}
      draggable={draggable && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Top left corner */}
      <div className={cn('flex flex-col items-start leading-none', isRed ? 'text-red-600' : 'text-gray-900')}>
        <span className={cn(sizeConfig.rankTop, 'font-bold')}>{rank}</span>
        <span className={sizeConfig.suitTop}>{suitSymbols[suit]}</span>
      </div>
      
      {/* Center suit */}
      <div className={cn('flex justify-center items-center flex-1', isRed ? 'text-red-600' : 'text-gray-900')}>
        <span className={sizeConfig.center}>{suitSymbols[suit]}</span>
      </div>
      
      {/* Bottom right corner (rotated) */}
      <div className={cn('flex flex-col items-end leading-none rotate-180', isRed ? 'text-red-600' : 'text-gray-900')}>
        <span className={cn(sizeConfig.rankTop, 'font-bold')}>{rank}</span>
        <span className={sizeConfig.suitTop}>{suitSymbols[suit]}</span>
      </div>
    </div>
  );
}
