import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  GraduationCap, 
  Target, 
  Users, 
  TrendingUp,
  PlayCircle,
  BookOpen,
  Award,
  MessageSquare
} from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  content: string;
  keyPoints: string[];
  examples: string[];
}

export const ResistanceHandlingTraining = () => {
  const [selectedModule, setSelectedModule] = useState<string>("overview");

  const trainingModules: TrainingModule[] = [
    {
      id: "resistance-levels",
      title: "The Three Levels of Resistance",
      category: "Foundation",
      content: "Understanding the three distinct levels of customer resistance is crucial for effective sales. Each level requires a different approach and strategy.",
      keyPoints: [
        "First Resistance: Light hesitation - 'I need to think about it'",
        "Second Resistance: Stronger doubts - deeper questioning",
        "Third Resistance: Final push - almost walking away"
      ],
      examples: [
        "Light: 'It's a bit expensive' → Comfort + Excitement + Value",
        "Stronger: Value questioning → VIP treatment + Exclusivity",
        "Final: Almost leaving → Best deal + Long-term relationship"
      ]
    },
    {
      id: "first-resistance",
      title: "First Resistance: Building Comfort",
      category: "Technique",
      content: "When clients show light hesitation, focus on making them comfortable while rebuilding excitement and showing additional value.",
      keyPoints: [
        "Step 1: Relax the client - give them space",
        "Step 2: Refresh their will - back to the mirror",
        "Step 3: Pain vs Pleasure - show the problem and solution",
        "Step 4: Offer a gift to sweeten the deal",
        "Step 5: Close confidently"
      ],
      examples: [
        "'I totally get it. You're not buying a house today—you're just treating your eyes!'",
        "'Look at the difference already! This is just the start.'",
        "'I'm going to throw in a year's supply of our premium eye cream, worth $150.'"
      ]
    },
    {
      id: "second-resistance",
      title: "Second Resistance: VIP Treatment",
      category: "Technique",
      content: "When resistance strengthens, create exclusivity and show special treatment to overcome price concerns and decision hesitation.",
      keyPoints: [
        "Step 1: Relax again - it's fine to think",
        "Step 2: Refresh their will - back to results",
        "Step 3: Offer VIP access - exclusive discount",
        "Step 4: Close with confidence"
      ],
      examples: [
        "'I'll make you a VIP member today with 30% off'",
        "'Limited VIP spots available - exclusive offer'",
        "'Shall we lock in this VIP price for you today?'"
      ]
    },
    {
      id: "third-resistance",
      title: "Third Resistance: Final Push",
      category: "Technique",
      content: "When clients are on the edge of walking away, offer your best deal while maintaining confidence and focusing on long-term relationship building.",
      keyPoints: [
        "Step 1: Stay calm and friendly",
        "Step 2: Refresh their will one last time",
        "Step 3: Offer final discount with good reason",
        "Step 4: Close confidently without pressure"
      ],
      examples: [
        "'I'll drop the price to $175 - my best offer'",
        "'Building long-term relationship with you'",
        "'Let's finalize this today so you can start enjoying benefits'"
      ]
    },
    {
      id: "sales-speech",
      title: "Complete Sales Speech Framework",
      category: "Scripts",
      content: "A comprehensive sales presentation structure for the non-surgical eye applicator, from opening to closing.",
      keyPoints: [
        "Opening: Build need through education",
        "Demo: Present solution with science",
        "Show Results: Create wow effect",
        "Closing: Transition to sale",
        "Upsell: Pass to expert"
      ],
      examples: [
        "'Did you know the skin around your eyes ages faster than any other part?'",
        "'Nano-particles thousands of times smaller than sand'",
        "'Your eyes are your business card'"
      ]
    }
  ];

  const resistanceHandlingSteps = [
    {
      level: "First Resistance",
      steps: [
        {
          title: "Relax the Client",
          script: "I totally get it. You're not buying a house today—you're just treating your eyes! No pressure, let's look at it one more time.",
          purpose: "Give them space to feel comfortable"
        },
        {
          title: "Refresh Their Will",
          script: "Look at the difference already! This is just the start. Imagine how much better your eyes will look after a few more uses.",
          purpose: "Get them back to the mirror, remind of wow factor"
        },
        {
          title: "Pain vs Pleasure",
          script: "The skin around the eyes is super delicate. Once it starts sagging, it presses on blood vessels, causing puffiness. This applicator fixes it from the inside.",
          purpose: "Show problem and solution clearly"
        },
        {
          title: "Offer Gift",
          script: "I'm going to throw in a year's supply of our premium eye cream, worth $150. You're actually saving money in the long run.",
          purpose: "Add value to overcome price resistance"
        },
        {
          title: "Close Confidently",
          script: "So, which card would you like to use to get started today?",
          purpose: "Assume the sale, be direct but not pushy"
        }
      ]
    },
    {
      level: "Second Resistance",
      steps: [
        {
          title: "Relax Again",
          script: "No problem. Take your time. I'll give you my card and a special coupon for online if you want to think longer.",
          purpose: "Reassure while creating urgency"
        },
        {
          title: "Refresh Will",
          script: "Look at your eyes again in the mirror. You can already see the difference, right? It's only going to get better.",
          purpose: "Refocus on results and benefits"
        },
        {
          title: "VIP Access",
          script: "I'll make you a VIP member today. 30% off, so you get the syringe for just $280. Exclusive offer for special clients.",
          purpose: "Create exclusivity and special treatment"
        },
        {
          title: "Close with Confidence",
          script: "Shall we lock in this VIP price for you today? Which card would you like to use?",
          purpose: "Create urgency around special pricing"
        }
      ]
    },
    {
      level: "Third Resistance",
      steps: [
        {
          title: "Stay Calm",
          script: "I understand. This is an important decision. Let me make this easier for you.",
          purpose: "Maintain composure and be helpful"
        },
        {
          title: "Final Refresh",
          script: "Take one last look at your eyes. This is just the beginning. With regular use, your eyes will look even younger and brighter.",
          purpose: "Last chance to show value and results"
        },
        {
          title: "Best Offer",
          script: "I'll drop the price to $175 for the syringe, no gift. My best offer because I believe in building long-term relationship.",
          purpose: "Show final discount with relationship focus"
        },
        {
          title: "Final Close",
          script: "Let's finalize this today so you can start enjoying benefits right away. Which card works best for you?",
          purpose: "Close without pressure, focus on benefits"
        }
      ]
    }
  ];

  const salesSpeechStructure = {
    opening: {
      title: "Opening Phase: Building the Need",
      sections: [
        {
          title: "Educate About Eyes' Vulnerability",
          content: "Did you know the skin around your eyes ages faster than any other part of your face? The skin here is incredibly thin, resting on a hollow structure. As we lose collagen, this delicate skin sags first, pressing on blood vessels and creating dark circles and puffiness."
        },
        {
          title: "Make It Personal",
          content: "People notice your eyes before anything else. Not your shoes, watch, or handbag. Your eyes are your business card—they tell the world how fresh, confident, and youthful you feel."
        }
      ]
    },
    demo: {
      title: "Demo Phase: Presenting the Solution",
      sections: [
        {
          title: "Explain the Science",
          content: "This uses nano-particles of mica and silica—minerals your skin is naturally made of. Thousands of times smaller than sand, they blend seamlessly and no one can be allergic to natural minerals."
        },
        {
          title: "How It Works",
          content: "These nano-minerals form an invisible matrix on the epidermis, immediately lifting and tightening for 18-24 hours. As wrinkles flatten, blood flow is restored, starting real skin transformation."
        },
        {
          title: "Usage Instructions",
          content: "First month: three times a week. After that: once a week as skin improves. This is an investment in lasting progress, not a quick fix."
        }
      ]
    },
    results: {
      title: "Show Results: Create the Wow Effect",
      sections: [
        {
          title: "Live Demonstration",
          content: "Apply to one eye while keeping client engaged. 'Take a look—you can see the skin tightening. Do you feel that firmness? This is the matrix in action.'"
        },
        {
          title: "Reinforce Value",
          content: "This is just the start. Imagine after three weeks—no puffiness, no dark circles, just smooth, youthful eyes."
        }
      ]
    },
    closing: {
      title: "Closing Phase: Transition to Sale",
      sections: [
        {
          title: "Positive Affirmation",
          content: "I can see you're loving this—your eyes are already brighter, and results will only get better."
        },
        {
          title: "Present Offer",
          content: "Special promotion today: take this home for [price]. Plus step-by-step guide for maximum results."
        },
        {
          title: "Close with Question",
          content: "What card are you using today? Let me prepare this for you."
        }
      ]
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Resistance Handling Master Training
          </CardTitle>
          <CardDescription>
            Complete sales methodology for overcoming customer resistance and closing deals
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resistance">Resistance Levels</TabsTrigger>
          <TabsTrigger value="scripts">Sales Scripts</TabsTrigger>
          <TabsTrigger value="practice">Practice Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">3 Resistance Levels</h4>
                  <p className="text-sm text-muted-foreground">Master each level with specific techniques</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">Proven Scripts</h4>
                  <p className="text-sm text-muted-foreground">Word-for-word responses that work</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Close More Deals</h4>
                  <p className="text-sm text-muted-foreground">Turn objections into opportunities</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Training Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="default">1</Badge>
                  <div>
                    <h4 className="font-semibold">Use Pain vs. Pleasure</h4>
                    <p className="text-sm text-muted-foreground">Talk about problems bothering the client, then focus on how your product fixes them</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="default">2</Badge>
                  <div>
                    <h4 className="font-semibold">Offer Value and Incentives</h4>
                    <p className="text-sm text-muted-foreground">Year's supply of cream, VIP discounts, exclusive offers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="default">3</Badge>
                  <div>
                    <h4 className="font-semibold">Close with Confidence</h4>
                    <p className="text-sm text-muted-foreground">"Which card would you like to use?" - Be clear and assertive</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resistance" className="space-y-6">
          <Accordion type="single" collapsible className="space-y-4">
            {resistanceHandlingSteps.map((level, levelIndex) => (
              <AccordionItem key={levelIndex} value={`level-${levelIndex}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant={levelIndex === 0 ? "default" : levelIndex === 1 ? "secondary" : "destructive"}>
                      {level.level}
                    </Badge>
                    <span>{level.level} - {level.steps.length} Steps</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {level.steps.map((step, stepIndex) => (
                      <Card key={stepIndex}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Badge variant="outline">{stepIndex + 1}</Badge>
                                {step.title}
                              </h4>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="font-medium text-sm mb-1">Script:</p>
                              <p className="text-sm italic">"{step.script}"</p>
                            </div>
                            <div>
                              <p className="font-medium text-sm mb-1">Purpose:</p>
                              <p className="text-sm text-muted-foreground">{step.purpose}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(salesSpeechStructure).map(([key, phase]) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>{phase.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {phase.sections.map((section, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">{section.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Scenarios</CardTitle>
              <CardDescription>Role-play these common situations to master your techniques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Scenario 1: Price Objection</h4>
                    <p className="text-sm mb-2"><strong>Customer says:</strong> "It's too expensive for me."</p>
                    <p className="text-sm text-muted-foreground"><strong>Your response:</strong> Use First Resistance technique - relax, refresh will, show value with gift</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Scenario 2: Need to Think</h4>
                    <p className="text-sm mb-2"><strong>Customer says:</strong> "I need to think about it and discuss with my spouse."</p>
                    <p className="text-sm text-muted-foreground"><strong>Your response:</strong> Second Resistance - offer VIP treatment and exclusive pricing</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Scenario 3: Ready to Leave</h4>
                    <p className="text-sm mb-2"><strong>Customer says:</strong> "I'm just not ready to make this decision today."</p>
                    <p className="text-sm text-muted-foreground"><strong>Your response:</strong> Third Resistance - stay calm, final discount, focus on relationship</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};