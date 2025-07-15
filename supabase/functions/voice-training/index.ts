import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const moduleType = url.searchParams.get('moduleType') || 'general';
  const userId = url.searchParams.get('userId');
  
  console.log('Starting voice training session:', { moduleType, userId });

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionActive = false;

  // System prompts for different training modules
  const getSystemPrompt = (type: string): string => {
    const prompts = {
      mindset: "You are an expert sales trainer focused on mindset coaching. Your role is to help sales professionals develop the winning mindset needed for high-pressure sales situations. Be encouraging, motivational, and provide practical mindset techniques. Keep responses conversational and under 30 seconds when spoken.",
      
      finding_why: "You are a sales coach specializing in helping salespeople discover their 'why' - their deeper motivation for success. Ask probing questions about their personal goals, family, dreams, and what drives them. Help them connect emotionally to their purpose. Keep responses personal and under 30 seconds.",
      
      sample_approach: "You are a field sales expert teaching the art of approaching customers with samples. Focus on confidence, timing, opening lines, and reading customer body language. Provide specific scripts and techniques for getting customers to try samples. Role-play scenarios and give immediate feedback.",
      
      connection_building: "You are a relationship-building expert teaching how to quickly establish trust and rapport with customers. Focus on active listening, finding common ground, mirroring techniques, and authentic conversation starters. Practice real conversations.",
      
      objection_handling: "You are a high-pressure sales expert teaching advanced objection handling techniques. Focus on turning every 'no' into a 'yes' through reframing, addressing concerns, and creating urgency. Be direct and assertive in your coaching style. Teach specific comeback techniques.",
      
      closing_techniques: "You are a master closer teaching powerful closing techniques. Focus on assumptive closes, urgency creation, overcoming hesitation, and sealing the deal. Be confident and teach aggressive but professional closing methods.",
      
      opener_to_upseller: "You are a sales operations expert teaching the critical handoff process from opener to upseller. Focus on seamless transitions, customer warmup techniques, and maximizing upsell potential. Teach coordination strategies.",
      
      high_pressure_tactics: "You are an advanced sales trainer teaching ethical high-pressure techniques. Focus on urgency creation, scarcity tactics, emotional triggers, and professional persistence. Maintain ethics while teaching assertive sales methods.",
      
      product_knowledge: "You are a product expert helping salespeople master every detail about skincare products and services. Focus on ingredients, benefits, competitive advantages, and how to communicate value effectively to customers.",
      
      customer_psychology: "You are a consumer psychology expert teaching how to read customer behavior, buying signals, motivations, and decision-making patterns. Focus on practical observation skills and psychological influence techniques."
    };
    
    return prompts[type as keyof typeof prompts] || 
           "You are a professional sales trainer helping employees improve their sales skills. Provide practical, actionable advice and engage in realistic sales scenarios. Keep responses conversational and under 30 seconds when spoken.";
  };

  socket.onopen = async () => {
    console.log('WebSocket connection opened');
    
    try {
      // Connect to OpenAI Realtime API
      const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
      
      openAISocket = new WebSocket(openAIUrl, [], {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      openAISocket.onopen = () => {
        console.log('OpenAI WebSocket connected');
        sessionActive = true;
        
        // Send session configuration
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: getSystemPrompt(moduleType),
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: 1000
          }
        };
        
        openAISocket?.send(JSON.stringify(sessionConfig));
        
        // Send welcome message to start the conversation
        const welcomeEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'input_text',
                text: getWelcomeMessage(moduleType)
              }
            ]
          }
        };
        
        openAISocket?.send(JSON.stringify(welcomeEvent));
        openAISocket?.send(JSON.stringify({ type: 'response.create' }));
      };

      openAISocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('OpenAI message:', data.type);
        
        // Forward all OpenAI messages to the client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: 'OpenAI connection failed'
          }));
        }
      };

      openAISocket.onclose = () => {
        console.log('OpenAI WebSocket closed');
        sessionActive = false;
      };

    } catch (error) {
      console.error('Error connecting to OpenAI:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Failed to initialize voice training session'
      }));
    }
  };

  socket.onmessage = (event) => {
    if (!openAISocket || !sessionActive) {
      console.log('OpenAI socket not ready, dropping message');
      return;
    }
    
    try {
      const message = JSON.parse(event.data);
      console.log('Client message type:', message.type);
      
      // Forward client messages to OpenAI
      openAISocket.send(event.data);
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket closed');
    sessionActive = false;
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    sessionActive = false;
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});

function getWelcomeMessage(moduleType: string): string {
  const welcomeMessages = {
    mindset: "Hey there! I'm your AI sales coach, and I'm excited to work on developing your winning mindset today. What's the biggest mental challenge you face when approaching potential customers?",
    
    finding_why: "Welcome to your 'Why' discovery session! I'm here to help you uncover what truly drives you to succeed in sales. Tell me, what are you working toward in your life right now?",
    
    sample_approach: "Ready to master the sample approach? I'm your field sales trainer, and we're going to practice confident customer approaches. Describe a typical customer you'd approach with samples.",
    
    connection_building: "Let's build those relationship skills! I'm here to help you create instant connections with customers. Tell me about a time when you struggled to connect with someone.",
    
    objection_handling: "Time to turn every 'no' into a 'yes'! I'm your objection-handling expert. What's the most common objection you hear from customers?",
    
    closing_techniques: "Welcome to closing mastery! I'm here to teach you powerful techniques that seal the deal. What's your current closing process like?",
    
    opener_to_upseller: "Let's perfect that handoff! I'm your transition expert. Tell me about your current process when passing customers to an upseller.",
    
    high_pressure_tactics: "Ready for advanced sales techniques? I'm here to teach you ethical high-pressure methods. What's your comfort level with assertive selling?",
    
    product_knowledge: "Let's master your product expertise! I'm here to help you know every detail about what you're selling. What products do you need to learn more about?",
    
    customer_psychology: "Welcome to customer psychology training! I'm here to teach you how to read customers like a book. What customer behaviors confuse you most?"
  };
  
  return welcomeMessages[moduleType as keyof typeof welcomeMessages] || 
         "Welcome to AI sales training! I'm your voice coach, ready to help you improve your sales skills through realistic conversation practice. What would you like to work on today?";
}