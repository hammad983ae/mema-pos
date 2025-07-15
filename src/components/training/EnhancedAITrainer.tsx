import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AITrainerResponse {
  content: string;
  suggestions: string[];
  score?: number;
  feedback?: string;
}

export class EnhancedAITrainer {
  private moduleType: string;
  private userId: string;
  private sessionId: string;

  constructor(moduleType: string, userId: string, sessionId: string) {
    this.moduleType = moduleType;
    this.userId = userId;
    this.sessionId = sessionId;
  }

  async generateResponse(userInput: string, conversationHistory: Array<{role: string, content: string}>): Promise<AITrainerResponse> {
    const lowerInput = userInput.toLowerCase();
    
    // Analyze user input for intent and context
    const analysis = this.analyzeUserInput(userInput, conversationHistory);
    
    // Generate contextual response based on module type and analysis
    const response = await this.generateContextualResponse(userInput, analysis);
    
    // Calculate performance score
    const score = this.calculatePerformanceScore(userInput, analysis);
    
    return {
      content: response.content,
      suggestions: response.suggestions,
      score,
      feedback: response.feedback
    };
  }

  private analyzeUserInput(input: string, history: Array<{role: string, content: string}>) {
    const lowerInput = input.toLowerCase();
    
    return {
      intent: this.detectIntent(lowerInput),
      confidence: this.assessConfidence(lowerInput),
      technique: this.identifyTechnique(lowerInput),
      emotions: this.detectEmotions(lowerInput),
      objections: this.identifyObjections(lowerInput),
      context: this.getConversationContext(history)
    };
  }

  private detectIntent(input: string): string {
    if (input.includes('question') || input.includes('how') || input.includes('what')) return 'question';
    if (input.includes('practice') || input.includes('try') || input.includes('roleplay')) return 'practice';
    if (input.includes('help') || input.includes('stuck') || input.includes('difficult')) return 'help';
    if (input.includes('no') || input.includes('not interested') || input.includes('think about it')) return 'objection';
    return 'general';
  }

  private assessConfidence(input: string): number {
    let confidence = 50; // Base confidence
    
    // Positive indicators
    if (input.includes('confident') || input.includes('ready') || input.includes('understand')) confidence += 20;
    if (input.includes('excited') || input.includes('motivated')) confidence += 15;
    
    // Negative indicators
    if (input.includes('nervous') || input.includes('scared') || input.includes('unsure')) confidence -= 20;
    if (input.includes('difficult') || input.includes('hard') || input.includes('struggle')) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private identifyTechnique(input: string): string | null {
    const techniques = {
      'feel_felt_found': ['feel', 'felt', 'found'],
      'assumptive_close': ['assume', 'when you', 'after you'],
      'scarcity': ['limited', 'last one', 'today only', 'exclusive'],
      'social_proof': ['others', 'customers', 'testimonial', 'reviews'],
      'urgency': ['now', 'today', 'quickly', 'urgent'],
      'pain_point': ['problem', 'issue', 'concern', 'worry']
    };

    for (const [technique, keywords] of Object.entries(techniques)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return technique;
      }
    }
    
    return null;
  }

  private detectEmotions(input: string): string[] {
    const emotions = [];
    
    if (input.includes('excited') || input.includes('happy') || input.includes('great')) emotions.push('positive');
    if (input.includes('nervous') || input.includes('anxious') || input.includes('worried')) emotions.push('nervous');
    if (input.includes('frustrated') || input.includes('angry')) emotions.push('frustrated');
    if (input.includes('confused') || input.includes('unclear')) emotions.push('confused');
    
    return emotions;
  }

  private identifyObjections(input: string): string[] {
    const objections = [];
    
    if (input.includes('too expensive') || input.includes('cost') || input.includes('price')) objections.push('price');
    if (input.includes('think about it') || input.includes('consider')) objections.push('stall');
    if (input.includes('spouse') || input.includes('husband') || input.includes('wife')) objections.push('authority');
    if (input.includes('not interested') || input.includes('not for me')) objections.push('interest');
    if (input.includes('time') || input.includes('busy')) objections.push('time');
    
    return objections;
  }

  private getConversationContext(history: Array<{role: string, content: string}>): string {
    if (history.length === 0) return 'opening';
    if (history.length < 3) return 'early';
    if (history.length < 6) return 'middle';
    return 'advanced';
  }

  private async generateContextualResponse(userInput: string, analysis: any): Promise<{content: string, suggestions: string[], feedback: string}> {
    const responses = this.getModuleResponses();
    let content = "";
    let suggestions: string[] = [];
    let feedback = "";

    // Generate response based on intent and module type
    switch (analysis.intent) {
      case 'question':
        content = this.generateQuestionResponse(userInput, analysis);
        suggestions = this.generateQuestionSuggestions(analysis);
        break;
      case 'practice':
        content = this.generatePracticeResponse(userInput, analysis);
        suggestions = this.generatePracticeSuggestions(analysis);
        break;
      case 'objection':
        content = this.generateObjectionResponse(userInput, analysis);
        suggestions = this.generateObjectionSuggestions(analysis);
        break;
      default:
        content = this.generateGeneralResponse(userInput, analysis);
        suggestions = this.generateGeneralSuggestions(analysis);
    }

    // Add module-specific enhancements
    content = this.enhanceWithModuleSpecifics(content, userInput, analysis);
    feedback = this.generatePerformanceFeedback(analysis);

    return { content, suggestions, feedback };
  }

  private generateQuestionResponse(input: string, analysis: any): string {
    const moduleResponses = this.getModuleResponses();
    const baseResponse = moduleResponses.questions || "Great question! Let me help you understand this better.";
    
    // Add confidence-based modifications
    if (analysis.confidence < 30) {
      return `${baseResponse} I can see you might be feeling uncertain - that's completely normal when learning new techniques. Let's break this down step by step...`;
    } else if (analysis.confidence > 70) {
      return `${baseResponse} I love your enthusiasm! You're asking the right questions. Let's dive deeper...`;
    }
    
    return baseResponse;
  }

  private generatePracticeResponse(input: string, analysis: any): string {
    const practiceScenarios = this.getPracticeScenarios();
    return practiceScenarios[Math.floor(Math.random() * practiceScenarios.length)];
  }

  private generateObjectionResponse(input: string, analysis: any): string {
    if (analysis.objections.includes('price')) {
      return `Perfect! Price objections are actually buying signals. Here's how to handle it:

**Step 1: Acknowledge** - "I understand price is important to you."
**Step 2: Reframe Value** - "Let me show you how this actually saves you money..."
**Step 3: Break it down** - "That's just $X per day for..."
**Step 4: Close** - "What payment method works best for you?"

Try practicing this approach!`;
    }
    
    if (analysis.objections.includes('stall')) {
      return `"I need to think about it" - Classic stall! Here's your response:

**Acknowledge**: "I totally understand, this is an important decision."
**Isolate**: "Is it the price, or is there something specific you're unsure about?"
**Assumption**: "Most people who say that are really asking 'Is this going to work for me?'"
**Demonstrate**: "Let me show you one more thing that might help..."

What specific part would you like to practice?`;
    }
    
    return "That's a common objection! Let me show you how to turn it into a sales opportunity...";
  }

  private generateGeneralResponse(input: string, analysis: any): string {
    const moduleResponses = this.getModuleResponses();
    return moduleResponses.general || "I'm here to help you master these sales techniques. What specific area would you like to focus on?";
  }

  private enhanceWithModuleSpecifics(content: string, input: string, analysis: any): string {
    const moduleEnhancements = {
      'sales_triangle': this.addSalesTriangleContext(content, input),
      'cocos_methodology': this.addCocosContext(content, input),
      'objection_handling': this.addObjectionHandlingContext(content, input),
      'closing_techniques': this.addClosingContext(content, input)
    };

    return moduleEnhancements[this.moduleType as keyof typeof moduleEnhancements] || content;
  }

  private addSalesTriangleContext(content: string, input: string): string {
    if (input.toLowerCase().includes('value')) {
      return `${content}

💡 **Sales Triangle Reminder**: Remember the three points:
1. **Client** (their needs & emotions)
2. **Product** (the solution)  
3. **You** (the bridge between them)

Your job is to create VALUE by connecting their pain to your solution!`;
    }
    return content;
  }

  private addCocosContext(content: string, input: string): string {
    if (input.toLowerCase().includes('opener') || input.toLowerCase().includes('syringe')) {
      return `${content}

🎯 **Cocos Opener Framework**:
1. **Build Need**: "The eyes show aging first..."
2. **Demo Setup**: "This uses nano-particles..."
3. **Show Results**: "Watch the difference..."
4. **Close**: "What card are you using?"

Remember: Confidence + Demonstration = Sale!`;
    }
    return content;
  }

  private addObjectionHandlingContext(content: string, input: string): string {
    return `${content}

🔄 **Remember the Formula**: 
Objection = Interest + Concern
Your job: Address the concern, amplify the interest!`;
  }

  private addClosingContext(content: string, input: string): string {
    return `${content}

🎯 **Closing Checklist**:
✓ Build excitement first
✓ Create urgency  
✓ Assume the sale
✓ Ask for the order
✓ Stay silent after asking`;
  }

  private calculatePerformanceScore(input: string, analysis: any): number {
    let score = 50; // Base score
    
    // Confidence adjustment
    score += (analysis.confidence - 50) * 0.3;
    
    // Technique usage
    if (analysis.technique) score += 15;
    
    // Length and detail
    if (input.length > 50) score += 10;
    if (input.length > 100) score += 5;
    
    // Positive language
    const positiveWords = ['confident', 'ready', 'excited', 'understand', 'practice'];
    positiveWords.forEach(word => {
      if (input.toLowerCase().includes(word)) score += 5;
    });
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generatePerformanceFeedback(analysis: any): string {
    let feedback = "";
    
    if (analysis.confidence < 30) {
      feedback += "💪 Building confidence takes practice. Keep going! ";
    } else if (analysis.confidence > 70) {
      feedback += "🔥 Great confidence level! ";
    }
    
    if (analysis.technique) {
      feedback += `✅ Nice use of ${analysis.technique.replace('_', ' ')} technique! `;
    }
    
    if (analysis.emotions.includes('nervous')) {
      feedback += "😌 It's normal to feel nervous. Each practice session builds confidence. ";
    }
    
    return feedback || "Keep practicing - you're on the right track!";
  }

  private generateQuestionSuggestions(analysis: any): string[] {
    return [
      "Can you give me a specific example?",
      "What would you say to a customer who...?",
      "How would you handle this objection?",
      "Let's practice this scenario together"
    ];
  }

  private generatePracticeSuggestions(analysis: any): string[] {
    return [
      "Try that approach with more confidence",
      "Add urgency to your close",
      "Use the customer's name more often",
      "Practice the objection handling framework"
    ];
  }

  private generateObjectionSuggestions(analysis: any): string[] {
    return [
      "Try the Feel-Felt-Found technique",
      "Ask clarifying questions first",
      "Acknowledge before redirecting",
      "Practice creating urgency"
    ];
  }

  private generateGeneralSuggestions(analysis: any): string[] {
    return [
      "Practice your opening approach",
      "Work on objection handling",
      "Focus on closing techniques",
      "Build product knowledge"
    ];
  }

  private getModuleResponses() {
    const responses = {
      'sales_triangle': {
        questions: "Great question about the Sales Triangle! Remember, it's all about creating value by connecting client needs with product benefits through your expertise.",
        general: "The Sales Triangle is your foundation. Every sale needs all three points: engaged client, right product, confident seller."
      },
      'cocos_methodology': {
        questions: "Perfect question about the Cocos method! This two-phase system is designed to maximize every customer interaction.",
        general: "The Cocos methodology focuses on the opener (syringe demo) transitioning to the upsell specialist. Both phases are crucial for maximum revenue."
      },
      'objection_handling': {
        questions: "Excellent question about objections! Remember, objections are buying signals - they show interest.",
        general: "Objection handling is an art. The key is to acknowledge, isolate, and redirect. Every 'no' gets you closer to 'yes'."
      },
      'closing_techniques': {
        questions: "Great closing question! The close starts from the moment you approach the customer.",
        general: "Closing is about confidence and assumptive language. Always assume they want to buy and just help them with the decision."
      }
    };

    return responses[this.moduleType as keyof typeof responses] || {
      questions: "Great question! Let me help you understand this technique better.",
      general: "I'm here to help you master sales techniques. What specific area would you like to focus on?"
    };
  }

  private getPracticeScenarios(): string[] {
    const scenarios = {
      'sales_triangle': [
        "A customer says 'I'm just looking.' How do you create value and engage them?",
        "Someone is interested but seems hesitant about price. How do you use the triangle?",
        "A customer loves the product but says they need to think about it. Your approach?"
      ],
      'cocos_methodology': [
        "It's time for the opener demo. Walk me through your syringe presentation.",
        "The customer is impressed with the eye demo. How do you transition to the upsell?",
        "You're the upseller. The customer just saw the syringe demo. What's your opening line?"
      ],
      'objection_handling': [
        "Customer: 'It's too expensive.' Your response?",
        "Customer: 'I need to ask my spouse.' How do you handle this?",
        "Customer: 'I'm not interested.' What's your comeback?"
      ],
      'closing_techniques': [
        "The customer is engaged and asking questions. Time to close. What do you say?",
        "They're holding the product and seem interested. Close them now.",
        "You've shown benefits, handled objections. Practice your closing sequence."
      ]
    };

    const moduleScenarios = scenarios[this.moduleType as keyof typeof scenarios];
    return moduleScenarios || [
      "Let's practice a sales scenario. I'll be the customer, you be the salesperson.",
      "Imagine a hesitant customer. How would you approach them?",
      "Practice your opening line with confidence."
    ];
  }
}