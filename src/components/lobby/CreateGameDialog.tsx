import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Lock, Globe } from 'lucide-react';

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGame: (isPublic: boolean, maxPlayers: number) => Promise<void>;
  loading?: boolean;
}

export function CreateGameDialog({ open, onOpenChange, onCreateGame, loading }: CreateGameDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);

  const handleCreate = async () => {
    await onCreateGame(isPublic, maxPlayers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create New Game</DialogTitle>
          <DialogDescription>
            Set up your game preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game Type */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Game</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? 'Anyone can join from the lobby' : 'Only players with invite code can join'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${!isPublic ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Globe className={`w-4 h-4 ${isPublic ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>

          {/* Player Count */}
          <div className="space-y-3">
            <Label className="text-base">Number of Players</Label>
            <RadioGroup
              value={maxPlayers.toString()}
              onValueChange={(val) => setMaxPlayers(parseInt(val))}
              className="grid grid-cols-3 gap-3"
            >
              {[2, 3, 4].map((num) => (
                <div key={num}>
                  <RadioGroupItem
                    value={num.toString()}
                    id={`players-${num}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`players-${num}`}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span className="text-lg font-semibold">{num}</span>
                    <span className="text-xs text-muted-foreground">Players</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Game'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
