import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, MapPin, Users, TrendingUp } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Owner & Lead Esthetician",
      business: "Luminous Skin Studio",
      location: "Beverly Hills, CA",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=300&h=300&fit=crop&crop=face",
      rating: 5,
      quote: "MemaPOS completely transformed how we operate. Our checkout time dropped from 3 minutes to under 30 seconds, and our inventory accuracy went from 85% to 99.2%. The commission tracking has boosted our team motivation significantly.",
      metrics: {
        revenue: "+45%",
        efficiency: "3x faster",
        satisfaction: "99% customers"
      },
      featured: true
    },
    {
      name: "Dr. Maya Patel",
      role: "Medical Director", 
      business: "Elite Dermatology & Spa",
      location: "Manhattan, NY",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
      rating: 5,
      quote: "Managing 8 locations was a nightmare before MemaPOS. Now I have real-time visibility into every aspect of our operations. The analytics helped us identify our most profitable services and optimize our pricing strategy.",
      metrics: {
        locations: "8 stores",
        growth: "+32% profit",
        time: "15hrs saved/week"
      }
    },
    {
      name: "Jennifer Martinez",
      role: "Operations Manager",
      business: "Glow Beauty Collective", 
      location: "Austin, TX",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face",
      rating: 5,
      quote: "The team scheduling and task management features are game-changers. Our staff utilization improved by 40%, and we eliminated scheduling conflicts entirely. Customer satisfaction scores hit an all-time high.",
      metrics: {
        utilization: "+40%",
        conflicts: "0 issues",
        team: "25 employees"
      }
    },
    {
      name: "Amanda Foster",
      role: "Franchise Owner",
      business: "Pure Radiance Spas",
      location: "Phoenix, AZ",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face", 
      rating: 5,
      quote: "As a franchise with 12 locations, consistency was our biggest challenge. MemaPOS standardized our operations while giving each location the flexibility they need. ROI was achieved in just 3 months.",
      metrics: {
        roi: "3 months",
        consistency: "+85%",
        revenue: "$2.1M tracked"
      }
    },
    {
      name: "Lisa Thompson",
      role: "Owner",
      business: "Serenity Skin & Wellness",
      location: "Seattle, WA", 
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=300&fit=crop&crop=face",
      rating: 5,
      quote: "The customer CRM is incredibly detailed for skincare businesses. Tracking skin concerns, treatment history, and product preferences has increased our customer retention rate to 94% and average purchase value by 60%.",
      metrics: {
        retention: "94%",
        value: "+60%",
        loyalty: "4.8★ rating"
      }
    },
    {
      name: "Marcus Johnson",
      role: "Co-Founder",
      business: "Urban Glow Studios",
      location: "Chicago, IL",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      rating: 5,
      quote: "MemaPOS's integration capabilities are outstanding. It seamlessly connected with our existing booking system, accounting software, and marketing tools. The implementation was smooth and support is exceptional.",
      metrics: {
        integrations: "8 tools",
        implementation: "2 weeks",
        support: "24/7 available"
      }
    }
  ];

  const stats = [
    { number: "500+", label: "Beauty Businesses", icon: Users },
    { number: "50M+", label: "Transactions Processed", icon: TrendingUp },
    { number: "99.2%", label: "Customer Satisfaction", icon: Star },
    { number: "200+", label: "Store Locations", icon: MapPin }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            Trusted by Premium Skincare Professionals
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Join hundreds of successful skincare businesses that have transformed their operations with MemaPOS
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center glass-effect p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300">
              <stat.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-3 sm:mb-4" />
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={`group transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 bg-gradient-card border-0 overflow-hidden relative ${
                testimonial.featured ? 'lg:col-span-2 xl:col-span-1' : ''
              }`}
            >
              {testimonial.featured && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary"></div>
              )}
              
              <CardContent className="p-6 sm:p-8">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 group-hover:text-foreground/90 transition-colors">
                  "{testimonial.quote}"
                </blockquote>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-primary/5 rounded-lg">
                  {Object.entries(testimonial.metrics).map(([key, value], i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-primary mb-1">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">{testimonial.role}</div>
                    <div className="text-xs sm:text-sm font-medium text-primary truncate">{testimonial.business}</div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 sm:mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-8">Trusted by industry leaders and certified professionals</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-60">
            {/* Mock certification badges */}
            <Badge variant="outline" className="px-4 py-2 text-xs font-medium">
              NCEA Certified Partner
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-xs font-medium">
              ISPA Technology Member
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-xs font-medium">
              Spa Industry Association
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-xs font-medium">
              Beauty Tech Alliance
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};