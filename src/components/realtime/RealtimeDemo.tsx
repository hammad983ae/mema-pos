import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeContext } from './RealtimeProvider';
import { Bell, Users, Zap, TestTube } from 'lucide-react';

/**
 * Demo component to test realtime functionality
 * This component allows testing notifications and presence features
 */
export const RealtimeDemo = () => {
  const { businessId, isConnected } = useRealtimeContext();
  const { createNotification } = useNotifications();
  const [testMessage, setTestMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestNotification = async () => {
    if (!testMessage.trim()) return;
    
    setLoading(true);
    try {
      await createNotification(
        'test',
        'Test Notification',
        testMessage,
        { demo: true }
      );
      setTestMessage('');
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSaleNotification = async () => {
    setLoading(true);
    try {
      await createNotification(
        'sale',
        'New Sale!',
        'A $1,299 sale was just completed by the team.',
        { 
          amount: 1299,
          items: ['Business Laptop'],
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error sending sale notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGoalNotification = async () => {
    setLoading(true);
    try {
      await createNotification(
        'goal_achieved',
        'Goal Achieved! 🎯',
        'Congratulations! You\'ve reached your monthly sales goal.',
        { 
          goalType: 'monthly_sales',
          target: 50000,
          achieved: 52000
        }
      );
    } catch (error) {
      console.error('Error sending goal notification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Realtime Demo
          </CardTitle>
          <CardDescription>
            Business context required for realtime features
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Realtime Demo
        </CardTitle>
        <CardDescription>
          Test live notifications and realtime features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <div className={`h-3 w-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            Realtime Connection: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Custom Test Notification */}
        <div className="space-y-3">
          <Label htmlFor="test-message">Custom Test Notification</Label>
          <div className="flex gap-2">
            <Input
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a test message..."
              disabled={loading}
            />
            <Button
              onClick={handleTestNotification}
              disabled={loading || !testMessage.trim() || !isConnected}
              className="flex-shrink-0"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>

        {/* Predefined Test Notifications */}
        <div className="space-y-3">
          <Label>Quick Test Notifications</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleTestSaleNotification}
              disabled={loading || !isConnected}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Test Sale Alert
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTestGoalNotification}
              disabled={loading || !isConnected}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Test Goal Achievement
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Notifications will appear in the notification bell in real-time</p>
          <p>• Multiple browser tabs will receive the same notifications</p>
          <p>• User presence is tracked automatically when multiple users are online</p>
        </div>
      </CardContent>
    </Card>
  );
};