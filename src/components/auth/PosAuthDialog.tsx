import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';

interface PosAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const PosAuthDialog = ({
                                isOpen,
                                onClose,
                                onSuccess,
                                title = 'Authentication Required',
                                description = 'Please enter your credentials to continue',
                              }: PosAuthDialogProps) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const { signInEmployee, loading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    signInEmployee(username, pin, false, () => {
      onSuccess();
      setUsername('');
      setPin('');
    });
  };

  const handleClose = () => {
    setUsername('');
    setPin('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
