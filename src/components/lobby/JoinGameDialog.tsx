import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JoinGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinGame: (code: string) => Promise<boolean>;
  loading?: boolean;
}

export function JoinGameDialog({ open, onOpenChange, onJoinGame, loading }: JoinGameDialogProps) {
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    const success = await onJoinGame(inviteCode.trim().toUpperCase());
    if (success) {
      onOpenChange(false);
      setInviteCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Join Private Game</DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="text-center text-2xl tracking-[0.5em] font-mono uppercase"
              maxLength={6}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleJoin} 
            disabled={loading || inviteCode.length !== 6}
          >
            {loading ? 'Joining...' : 'Join Game'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
