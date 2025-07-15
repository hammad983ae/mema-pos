import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Users, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Play,
  BookOpen,
  Trophy,
  Zap,
  Eye,
  MessageSquare,
  DollarSign,
  Clock
} from "lucide-react";

interface TrainingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  content: string[];
  keyPoints: string[];
}

export const CocosSalesTraining = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const trainingSections: TrainingSection[] = [
    {
      id: "sales-triangle",
      title: "The Sales Triangle",
      description: "Foundation of every sale - connecting client, product, and seller",
      icon: Target,
      content: [
        "A sale is the perfect connection between the client, the product, and you (the seller)",
        "The seller is the bridge between the client and the product",
        "Connection must happen in this order: Seller → Client → Product",
        "Build trust, create value, and show your expertise first",
        "Then help the client see how the product solves their problem"
      ],
      keyPoints: [
        "Emotional Value: Connect through energy, bonding, and fun",
        "Rational Value: Show practical benefits and solutions",
        "People fear pain more than they seek pleasure",
        "Once they feel excitement and bonding, defenses lower"
      ]
    },
    {
      id: "assets-exchange",
      title: "Client vs Seller Assets",
      description: "Understanding the value exchange in every sale",
      icon: Users,
      content: [
        "A sale is a trade between the assets of the client and the seller",
        "Client's Assets: Time, Focus, Money, Information",
        "Seller's Assets: Energy, Bonding/Attention, Expertise/Knowledge, Solution",
        "Goal: Match your assets to their needs to create relevant value"
      ],
      keyPoints: [
        "If worried about wrinkles → show quick, visible solution",
        "If hesitant about price → emphasize long-term savings",
        "Every second they stop matters - make it worthwhile",
        "Present yourself as the authority and surprise them with knowledge"
      ]
    },
    {
      id: "opener-process",
      title: "Phase 1: The Opener",
      description: "Selling the non-surgical eye applicator (syringe)",
      icon: Eye,
      content: [
        "Step 1: Build the Need - Introduce the problem of eye aging",
        "Step 2: Present the Solution - Introduce the Non-Surgical Eye Applicator",
        "Step 3: Show Results - Create the WOW effect with live demo",
        "Step 4: Start Closing - Present price confidently and close the sale"
      ],
      keyPoints: [
        "Eyes are first to show aging - delicate skin loses collagen",
        "Nano-particles of mica and silica create invisible matrix",
        "Instant 18-24 hour results + long-term blood flow improvement",
        "Close with: 'What card are you going to use?'"
      ]
    },
    {
      id: "upsell-transition",
      title: "Phase 2: The Upsell",
      description: "Passing client to expert for advanced devices",
      icon: TrendingUp,
      content: [
        "Frame the Opportunity - Build excitement for advanced solutions",
        "Introduce the Expert - Position as top specialist in demand",
        "Build Urgency - Rare chance for custom consultation",
        "Transition Assertively - Lead them confidently to expert"
      ],
      keyPoints: [
        "Create excitement about full face/body care possibilities",
        "Expert works with advanced med spa technology celebrities use",
        "Make meeting the expert feel exclusive and valuable",
        "Set expert up for success with proper introduction"
      ]
    },
    {
      id: "sales-structure",
      title: "The Complete Sales Structure",
      description: "Step-by-step roadmap for every sale",
      icon: MessageSquare,
      content: [
        "Introduction: Present as expert, identify problem, get agreement",
        "Demo: Short and specific, create wow effect, build imagination",
        "Closing: Highlight enthusiasm, let them hold product, present price",
        "Follow through: Create urgency and ask closing questions"
      ],
      keyPoints: [
        "Always present yourself as skincare expert first",
        "Focus on main benefit during demo",
        "Make it real with usage instructions",
        "Close with confidence and clear next steps"
      ]
    },
    {
      id: "resistance-handling",
      title: "Handling Resistance",
      description: "Confidently managing objections and hesitation",
      icon: Zap,
      content: [
        "Real Resistance: Reject calmly, change perspective, add value",
        "Fake Resistance: Stay confident, refresh excitement, offer incentive",
        "Always stay relaxed and keep the mood light",
        "Resistance is normal - it can be real or fake"
      ],
      keyPoints: [
        "Thinking? You're not buying a house - it's just self-care!",
        "€15/month - less than a sandwich, we're talking about your eyes",
        "Saves money on expensive creams and treatments",
        "Remember how smooth your skin looked after one use?"
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const markCompleted = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const completionPercentage = (completedSections.size / trainingSections.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Cocos Sales Training Guide
          </CardTitle>
          <CardDescription>
            Master our proven sales methods to maximize success and build stronger client relationships
          </CardDescription>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Training Progress</span>
              <span>{Math.round(completionPercentage)}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Training Overview</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="scripts">Key Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trainingSections.map((section) => {
              const IconComponent = section.icon;
              const isCompleted = completedSections.has(section.id);
              const isActive = activeSection === section.id;

              return (
                <Card 
                  key={section.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${isCompleted ? 'bg-success/5 border-success/20' : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <IconComponent className={`h-5 w-5 ${isCompleted ? 'text-success' : 'text-primary'}`} />
                      {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
                    </div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription className="text-sm">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      variant={isActive ? "default" : "outline"} 
                      size="sm" 
                      className="w-full"
                    >
                      {isActive ? "Collapse" : "Learn More"}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {activeSection && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const section = trainingSections.find(s => s.id === activeSection);
                    const IconComponent = section?.icon;
                    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
                  })()}
                  {trainingSections.find(s => s.id === activeSection)?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Core Concepts:</h4>
                  <ul className="space-y-1">
                    {trainingSections.find(s => s.id === activeSection)?.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Points:</h4>
                  <div className="grid gap-2">
                    {trainingSections.find(s => s.id === activeSection)?.keyPoints.map((point, index) => (
                      <Badge key={index} variant="outline" className="justify-start p-2 text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => markCompleted(activeSection)}
                    disabled={completedSections.has(activeSection)}
                    className="flex-1"
                  >
                    {completedSections.has(activeSection) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setActiveSection(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4">
            {trainingSections.map((section, index) => {
              const IconComponent = section.icon;
              const isCompleted = completedSections.has(section.id);

              return (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Module {index + 1}: {section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {10 + index * 5}min
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="font-medium">Learning Objectives:</span>
                        <ul className="mt-1 space-y-1">
                          {section.keyPoints.slice(0, 2).map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Study Content
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => markCompleted(section.id)}
                          disabled={isCompleted}
                        >
                          {isCompleted ? "Completed" : "Start Module"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Opening Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Build the Need:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "The eyes are the first place to show aging. The skin around them is so delicate, and over time, it loses collagen and elastin. This causes the skin to sag, pressing on the blood vessels beneath and creating wrinkles, puffiness, and dark circles."
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Make It Personal:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "Everyone sees your eyes first, not your shoes or your watch. Your eyes are your business card—they tell the world how youthful and confident you feel."
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Demo Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Introduce Product:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "This is our Non-Surgical Eye Applicator, designed to give instant and long-term results. It works with nano-particles of two natural minerals, mica and silica, which are already in your skin."
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Show Results:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "Look at this side compared to the other. See how smooth and lifted it looks? And feel the firmness—that's the invisible matrix doing its job."
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Closing Scripts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Present Price:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "The best part? You can take this home today for just [price]. And because we're here at the airport, I'll include a guide to help you maximize your results."
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Close Sale:</h4>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    "What card are you going to use? Let me get this ready for you."
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};