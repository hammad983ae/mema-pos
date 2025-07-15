import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Volume2, Mic, MessageCircle, Phone, PhoneOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const VoiceTrainingDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [demoMode, setDemoMode] = useState<'text' | 'voice'>('text');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Uint8Array[]>([]);
  const isPlayingAudioRef = useRef(false);
  const { toast } = useToast();

  // Real objection scenarios from actual sales training
  const objectionScenarios = [
    {
      scenario: "Price Objection - Premium Skincare",
      customer_objection: "Your products are way too expensive. I can get similar skincare products at the drugstore for half the price.",
      ideal_response: "I completely understand price is important to you. What I'd love to show you is the difference in ingredients and results. Our serums use medical-grade peptides and clinical concentrations that you simply can't find in drugstore products. When you break down the cost per use, you're looking at about $1.50 per application for results that typically cost $200+ at a dermatologist's office.",
      coaching_tip: "Notice how we acknowledged the concern, then redirected to value and quantified the benefit. Always give specific comparisons that justify the investment."
    },
    {
      scenario: "Authority Objection - Decision Maker",
      customer_objection: "I need to talk to my husband/wife first before making any decisions about spending this much money.",
      ideal_response: "That's completely understandable - this is an investment in your skin and confidence. What specific concerns do you think they'll have? Is it the price, or would they want to know more about the results? I can give you some information to share with them, or we could schedule a quick call so I can answer their questions directly.",
      coaching_tip: "Never accept 'I need to think about it' at face value. Dig deeper to understand the real concern and offer solutions that move the conversation forward."
    },
    {
      scenario: "Skepticism Objection - Results Doubt",
      customer_objection: "I've tried so many products before that promised amazing results but never worked. How do I know this won't be the same?",
      ideal_response: "I hear this a lot, and honestly, that skepticism makes perfect sense given what's out there. Here's what makes us different - we have a 90-day money-back guarantee, and I can show you before-and-after photos from customers with your exact skin concerns. Plus, we do a skin analysis first to ensure you get exactly what your skin needs, not a one-size-fits-all solution.",
      coaching_tip: "Skepticism means they want to buy but need proof. Provide evidence, guarantees, and social proof. Their past disappointment is actually a buying signal."
    }
  ];

  const currentScenario = objectionScenarios[0]; // Default to first scenario

  const demoConversation = [
    {
      speaker: "AI Trainer",
      text: `Hi! I'm your AI sales trainer. Let's practice a real-world scenario: "${currentScenario.scenario}". I'll play the customer. Ready?`,
      type: "ai"
    },
    {
      speaker: "Customer (AI)",
      text: currentScenario.customer_objection,
      type: "customer"
    },
    {
      speaker: "You",
      text: "I understand your concern about price. Let me explain the value...",
      type: "user"
    },
    {
      speaker: "AI Trainer",
      text: currentScenario.coaching_tip,
      type: "ai-feedback"
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && demoMode === 'text') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((step) => {
              if (step >= demoConversation.length - 1) {
                setIsPlaying(false);
                return 0;
              }
              return step + 1;
            });
            return 0;
          }
          return prev + 3;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, demoMode]);

  const createWavFromPCM = (pcmData: Uint8Array) => {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  };

  const playAudioData = async (audioData: Uint8Array) => {
    if (!audioContextRef.current) return;
    
    audioQueueRef.current.push(audioData);
    
    if (!isPlayingAudioRef.current) {
      await playNextAudio();
    }
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      setIsAISpeaking(false);
      return;
    }

    isPlayingAudioRef.current = true;
    setIsAISpeaking(true);
    
    const audioData = audioQueueRef.current.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const audioBuffer = await audioContextRef.current!.decodeAudioData(wavData.buffer);
      
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      
      source.onended = () => playNextAudio();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      playNextAudio();
    }
  };

  const connectToVoiceTrainer = async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to voice training WebSocket
      const wsUrl = `wss://cmlxvmjjlplrldvitlix.supabase.co/functions/v1/voice-training?moduleType=objection_handling&userId=demo`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to voice trainer');
        setIsConnected(true);
        setDemoMode('voice');
        toast({
          title: "Voice Training Connected!",
          description: "You can now speak with the AI trainer about objection handling",
        });
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Voice trainer message:', data.type);
        
        if (data.type === 'response.audio.delta' && data.delta) {
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await playAudioData(bytes);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Voice trainer error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice trainer. Please try again.",
          variant: "destructive"
        });
      };

      wsRef.current.onclose = () => {
        console.log('Voice trainer disconnected');
        setIsConnected(false);
        setDemoMode('text');
      };

    } catch (error) {
      console.error('Error connecting to voice trainer:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to start voice training session",
        variant: "destructive"
      });
    }
  };

  const disconnectVoiceTrainer = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setDemoMode('text');
    setIsAISpeaking(false);
  };

  const handlePlayDemo = () => {
    if (demoMode === 'text') {
      if (!isPlaying) {
        setCurrentStep(0);
        setProgress(0);
      }
      setIsPlaying(!isPlaying);
    } else {
      // Voice mode - start/stop voice training
      if (isConnected) {
        disconnectVoiceTrainer();
      } else {
        connectToVoiceTrainer();
      }
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-card border-success/20 shadow-glow">
      {/* AI Training Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className={`${isConnected ? 'bg-success/20' : 'bg-success/10'} text-success border-success/30 shadow-soft`}>
          <Volume2 className={`h-3 w-3 mr-1 ${isAISpeaking ? 'animate-pulse' : ''}`} />
          {isConnected ? 'Live Voice AI' : 'Voice AI Demo'}
        </Badge>
      </div>

      <CardContent className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 bg-success/10 px-4 py-2 rounded-full">
              <Mic className={`h-4 w-4 text-success ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-success">
                {isConnected ? 'Live Objection Training' : 'Objection Handling Demo'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              Master Real Sales Objections with AI
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isConnected 
                ? "Speak naturally - the AI will role-play as a customer with real objections"
                : "Experience our AI trainer handling actual customer objections from the field"
              }
            </p>
          </div>

          {/* Current Scenario Display */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-amber-800">{currentScenario.scenario}</h4>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Real Scenario
              </Badge>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-amber-700">Customer Objection:</span>
                <p className="text-sm text-amber-800 mt-1">"{currentScenario.customer_objection}"</p>
              </div>
              {demoMode === 'text' && (
                <div>
                  <span className="text-xs font-medium text-amber-700">Coaching Insight:</span>
                  <p className="text-sm text-amber-800 mt-1">{currentScenario.coaching_tip}</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Display or Voice Status */}
          {demoMode === 'text' ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {demoConversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 transition-all duration-300 ${
                    index <= currentStep ? 'opacity-100' : 'opacity-30'
                  } ${index === currentStep && isPlaying ? 'animate-pulse-slow' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'ai' || message.type === 'ai-feedback' 
                      ? 'bg-success text-success-foreground'
                      : message.type === 'customer'
                        ? 'bg-amber-500 text-white'
                        : 'bg-primary text-primary-foreground'
                  }`}>
                    {message.type === 'ai' || message.type === 'ai-feedback' ? (
                      <MessageCircle className="h-4 w-4" />
                    ) : message.type === 'customer' ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium ${
                        message.type === 'ai-feedback' ? 'text-success' 
                        : message.type === 'customer' ? 'text-amber-700'
                        : 'text-foreground'
                      }`}>
                        {message.speaker}
                      </span>
                      {message.type === 'ai-feedback' && (
                        <Badge variant="outline" className="text-xs border-success/30 text-success">
                          Coaching
                        </Badge>
                      )}
                      {message.type === 'customer' && (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                          Role-play
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      message.type === 'ai-feedback' 
                        ? 'text-success font-medium'
                        : message.type === 'customer'
                          ? 'text-amber-800 font-medium'
                          : 'text-muted-foreground'
                    }`}>
                      {message.text}
                    </p>
                    {index === currentStep && isPlaying && (
                      <div className="mt-2 w-full bg-success/20 rounded-full h-1">
                        <div 
                          className="bg-success h-1 rounded-full transition-all duration-100 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              {isConnected ? (
                <div className="space-y-3">
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                    isAISpeaking ? 'bg-success animate-pulse' : 'bg-success/20'
                  }`}>
                    <Mic className={`h-8 w-8 text-success ${isAISpeaking ? 'text-white' : ''}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAISpeaking ? 'AI Trainer is speaking...' : 'Speak now to practice objection handling'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try saying: "I think your products are too expensive"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                    <PhoneOff className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Click below to start live voice training</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t border-success/20">
            <Button
              onClick={handlePlayDemo}
              variant="outline"
              size="lg"
              className="bg-success/5 border-success/30 hover:bg-success/10 text-success hover:text-success font-medium"
            >
              {demoMode === 'text' ? (
                <>
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPlaying ? 'Pause Demo' : 'Play Demo'}
                </>
              ) : (
                <>
                  {isConnected ? (
                    <PhoneOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  {isConnected ? 'End Voice Session' : 'Start Live Voice Training'}
                </>
              )}
            </Button>
            
            {demoMode === 'text' && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  Step {Math.min(currentStep + 1, demoConversation.length)} of {demoConversation.length}
                </div>
              </div>
            )}
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-success/20">
            <div className="text-center space-y-1">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Mic className="h-4 w-4 text-success" />
              </div>
              <div className="text-xs font-medium text-success">Real Objections</div>
              <div className="text-xs text-muted-foreground">Field-tested scenarios</div>
            </div>
            <div className="text-center space-y-1">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-4 w-4 text-success" />
              </div>
              <div className="text-xs font-medium text-success">Live Coaching</div>
              <div className="text-xs text-muted-foreground">Instant feedback</div>
            </div>
            <div className="text-center space-y-1">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Volume2 className="h-4 w-4 text-success" />
              </div>
              <div className="text-xs font-medium text-success">Voice Interaction</div>
              <div className="text-xs text-muted-foreground">Natural conversation</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};