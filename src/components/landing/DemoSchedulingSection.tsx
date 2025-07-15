import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Users,
  Package
} from "lucide-react";

// Import mockup image
import scheduleMockup from "@/assets/schedule-mockup.jpg";
import { DemoRequestForm } from "@/components/forms/DemoRequestForm";

export const DemoSchedulingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="demo" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Interactive Demo Experience</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive platform with detailed feature demonstrations and real-world scenarios
          </p>
        </div>

        {/* Team Scheduling Demo Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="lg:order-2">
            <Badge className="mb-4 bg-accent/50 text-accent-foreground border-accent/20">
              <Calendar className="h-3 w-3 mr-1" />
              Team Management Demo
            </Badge>
            <h3 className="text-3xl font-bold mb-6">Smart Scheduling & Team Coordination</h3>
            <p className="text-lg text-muted-foreground mb-8">
              See how our intelligent scheduling system manages staff shifts, client appointments, and treatment bookings across multiple locations.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="bg-gradient-card rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">This Week's Schedule</h4>
                  <Badge variant="outline" className="text-xs">Live Demo</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sarah Chen - Lead Esthetician</p>
                      <p className="text-xs text-muted-foreground">Mon-Wed: 9AM-5PM, Facial treatments & consultations</p>
                    </div>
                    <Badge className="bg-success/10 text-success text-xs">Active</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Marketing Team Meeting</p>
                      <p className="text-xs text-muted-foreground">Thu 2PM: Q4 campaign planning & influencer partnerships</p>
                    </div>
                    <Badge className="bg-warning/10 text-warning text-xs">Upcoming</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Inventory Audit</p>
                      <p className="text-xs text-muted-foreground">Fri 10AM: Monthly stock count & supplier reviews</p>
                    </div>
                    <Badge className="bg-muted text-muted-foreground text-xs">Scheduled</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-secondary rounded-lg p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">24</div>
                  <div className="text-xs text-muted-foreground">Appointments Today</div>
                </div>
                <div className="bg-gradient-secondary rounded-lg p-4 border border-border/50 text-center">
                  <div className="text-2xl font-bold text-success mb-1">12</div>
                  <div className="text-xs text-muted-foreground">Staff On Duty</div>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate('/team')} variant="outline" className="h-12 px-6 mr-4">
              <Calendar className="h-5 w-5 mr-2" />
              View Full Schedule
            </Button>
            <Button onClick={() => navigate('/team')} className="h-12 px-6">
              Try Team Demo
            </Button>
          </div>
          
          <div className="relative lg:order-1">
            <div className="absolute inset-0 bg-gradient-accent opacity-10 rounded-2xl blur-xl"></div>
            <img 
              src={scheduleMockup} 
              alt="Team Scheduling Interface" 
              className="relative rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Demo Booking Form */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Schedule Your Personalized Demo
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Get a tailored walkthrough of MemaPOS with our skincare retail experts. See exactly how our platform can transform your business operations.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">30-Minute Deep Dive</h4>
                    <p className="text-sm text-muted-foreground">Comprehensive walkthrough of POS, inventory, analytics, and team management features with real skincare business scenarios</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Industry Expert Guidance</h4>
                    <p className="text-sm text-muted-foreground">Connect with specialists who understand premium skincare retail operations and can customize the demo to your specific needs</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Implementation Roadmap</h4>
                    <p className="text-sm text-muted-foreground">Receive a detailed plan for rolling out MemaPOS across your locations, including training, data migration, and launch timeline</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button size="lg" className="h-12 px-8">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Demo
                </Button>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Available Mon-Fri, 9AM-6PM EST</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="bg-gradient-card border-0 shadow-elegant">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Book Your Consultation</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete this form and we'll reach out within 2 business hours
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">First Name *</label>
                        <input 
                          type="text" 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Last Name *</label>
                        <input 
                          type="text" 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Business Email *</label>
                      <input 
                        type="email" 
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="john@yourbusiness.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                        <input 
                          type="tel" 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
                        <input 
                          type="text" 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Spa Name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Number of Locations</label>
                        <select className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                          <option>1 location</option>
                          <option>2-5 locations</option>
                          <option>6-20 locations</option>
                          <option>20+ locations</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Monthly Revenue</label>
                        <select className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                          <option>Under $10k</option>
                          <option>$10k - $50k</option>
                          <option>$50k - $100k</option>
                          <option>$100k+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">What's your biggest operational challenge?</label>
                      <textarea 
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={3}
                        placeholder="e.g., inventory management, staff scheduling, customer retention..."
                      />
                    </div>

                    <Button className="w-full mt-6 h-12">
                      <Mail className="h-5 w-5 mr-2" />
                      Request Demo Call
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      By submitting this form, you agree to receive marketing communications from MemaPOS. 
                      We respect your privacy and you can unsubscribe at any time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};