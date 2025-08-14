import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Calendar } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import {
  CLOCK_IN,
  CLOCK_OUT,
  GET_USER_ACTIVE_CLOCK,
  Mutation,
  MutationClockInArgs,
  PosSession,
  Query,
  QueryFindUserActiveEmployeeClockArgs,
} from '@/graphql';
import { useAuth } from '@/hooks/useAuth.tsx';
import { showSuccess } from '@/hooks/useToastMessages.tsx';
import { PosAuthDialog } from '@/components/auth/PosAuthDialog.tsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ClockIn = () => {
  const { user } = useAuth();
  const session = PosSession();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data, loading, refetch } = useQuery<
    Query,
    QueryFindUserActiveEmployeeClockArgs
  >(GET_USER_ACTIVE_CLOCK, {
    variables: { userId: user.id },
    fetchPolicy: 'network-only',
  });
  const [clockIn, { loading: clockingIn }] = useMutation<
    Mutation,
    MutationClockInArgs
  >(CLOCK_IN);
  const [clockOut, { loading: clockingOut }] = useMutation<Mutation>(CLOCK_OUT);

  const handleClockIn = async () => {
    clockIn({
      variables: {
        storeId: session.store.id,
      },
    }).then(() => {
      showSuccess('You have clocked in successfully');

      refetch();
    });
  };

  const handleClockOut = async () => {
    if (!data?.findUserActiveEmployeeClock) return;

    clockOut().then(() => {
      showSuccess('You have clocked out successfully');
      refetch();
    });
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthDialog(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please authenticate to access
          </p>
        </div>
        <PosAuthDialog
          isOpen={showAuthDialog}
          onClose={() => {
            navigate('/pos');
          }}
          onSuccess={handleAuthSuccess}
          title="Authentication Required"
          description="Please enter your credentials to clock in/out"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Clock In/Out
          </h2>
          <p className="text-muted-foreground">
            Simple daily attendance tracking
          </p>
        </div>
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-muted-foreground">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xl text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="space-y-4">
              {!data?.findUserActiveEmployeeClock ? (
                <>
                  <Button
                    size="lg"
                    className="w-full text-lg py-6"
                    onClick={handleClockIn}
                    loading={clockingIn}
                  >
                    <Calendar className="h-6 w-6 mr-3" />
                    Clock In for Today
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Click to record your arrival for today's shift
                  </p>
                </>
              ) : (
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={handleClockOut}
                  loading={clockingOut}
                >
                  <Calendar className="h-6 w-6 mr-3" />
                  Clock Out
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
