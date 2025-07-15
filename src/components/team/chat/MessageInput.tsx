import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  X, 
  Calendar,
  Image as ImageIcon 
} from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  onSendFile: (file: File) => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendScheduleUpdate: (scheduleData: any) => void;
  replyingTo?: any;
  onClearReply: () => void;
  channelName: string;
}

export const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  onSendFile, 
  onSendVoice,
  onSendScheduleUpdate,
  replyingTo,
  onClearReply,
  channelName 
}: MessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTime = useRef<number>(0);
  const recordingInterval = useRef<NodeJS.Timeout>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
        onSendVoice(audioBlob, duration);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      recordingStartTime.current = Date.now();
      setRecordingTime(0);
      
      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStartTime.current) / 1000));
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSendFile(file);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScheduleShare = () => {
    // Mock schedule data - in real app, this would come from a schedule picker
    const scheduleData = {
      type: 'schedule_update',
      message: 'New schedule posted for next week',
      schedule_date: new Date().toISOString(),
      shifts: [
        { date: '2024-01-15', start: '09:00', end: '17:00', employee: 'Current User' }
      ]
    };
    onSendScheduleUpdate(scheduleData);
  };

  return (
    <div className="space-y-2">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="text-sm">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">{replyingTo.profiles?.full_name}</span>
            <p className="text-muted-foreground truncate max-w-xs">
              {replyingTo.content}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {/* File attachment */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Schedule sharing */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleScheduleShare}
          className="h-8 w-8"
        >
          <Calendar className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message #${channelName}`}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          className="flex-1"
          disabled={isRecording}
        />

        {/* Voice recording */}
        <div className="flex items-center space-x-1">
          {isRecording && (
            <Badge variant="destructive" className="text-xs">
              {recordingTime}s
            </Badge>
          )}
          
          <Button 
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className="h-8 w-8"
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Send button */}
        <Button 
          onClick={onSendMessage}
          disabled={!newMessage.trim() || isRecording}
          size="icon"
          className="h-8 w-8"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};