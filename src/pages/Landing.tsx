import { Activity, ArrowRight, Brain, Calendar, ClipboardCheck, FileText, Heart, Shield, Stethoscope, Users, Video, Zap, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Rotating hero images
  const heroImages = [
    "/Images/img (1).jpg",
    "/Images/img (2).jpg",
    "/Images/img (3).jpg",
    "/Images/img (4).jpg",
    "/Images/img (5).jpg",
  ];

  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Complete patient records, history, and demographic management in one place.",
      image: "/Images/img (6).jpg"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Intelligent appointment booking with collision detection and real-time availability.",
      image: "/Images/img (7).jpg"
    },
    {
      icon: Brain,
      title: "AI Consultation Assistant",
      description: "AI-powered transcription and medical summarization to save time and improve accuracy.",
      image: "/Images/img (8).jpg"
    },
    {
      icon: FileText,
      title: "Digital Prescriptions",
      description: "ICP-Brasil compliant digital signatures with QR code verification.",
      image: "/Images/img (9).jpg"
    },
    {
      icon: Video,
      title: "Telemedicine",
      description: "Built-in WebRTC video consultations with recording and consent management.",
      image: "/Images/img (10).jpg"
    },
    {
      icon: ClipboardCheck,
      title: "Medical Records",
      description: "Complete EMR system with audit trails and HIPAA-compliant security.",
      image: "/Images/img (1).jpg"
    },
    {
      icon: Heart,
      title: "Waiting Queue",
      description: "Real-time queue management with priority system and patient notifications.",
      image: "/Images/img (2).jpg"
    },
    {
      icon: Shield,
      title: "TISS Integration",
      description: "Seamless integration with Brazilian health insurance systems.",
      image: "/Images/img (3).jpg"
    },
    {
      icon: Zap,
      title: "Offline-First",
      description: "Work without internet and sync when you're back online.",
      image: "/Images/img (4).jpg"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Patients Managed" },
    { value: "50,000+", label: "Appointments" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { opacity: 0.8; box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
      `}</style>

      {/* Header/Navigation */}
      <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled 
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg" 
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105" 
            onClick={() => navigate("/")}
          >
            <img 
              src="/Logo/Prontivus Horizontal.png" 
              alt="Prontivus Logo" 
              className="h-36 w-auto animate-float"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/login")}
              className="hover:scale-105 transition-transform duration-200"
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate("/login")}
              className="hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 overflow-hidden">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <Badge variant="secondary" className="w-fit">
              <Zap className="mr-1 h-3 w-3" />
              Modern Healthcare Management Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Transform Your Healthcare
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent animate-gradient">
                Practice Management
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Complete medical SaaS platform with AI-powered tools, telemedicine, 
              digital prescriptions, and seamless TISS integration. Everything you need 
              to run a modern healthcare practice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")} 
                className="text-lg h-12 px-8 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/login")} 
                className="text-lg h-12 px-8 hover:scale-105 transition-all duration-200 group"
              >
                Sign In
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                <Shield className="h-4 w-4 text-primary" />
                LGPD Compliant
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                <Heart className="h-4 w-4 text-primary" />
                ICP-Brasil Certified
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                <Zap className="h-4 w-4 text-primary" />
                Enterprise Ready
              </div>
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border hover:shadow-3xl transition-shadow duration-300 group">
              {heroImages.map((image, index) => (
                <div
                  key={image}
                  className={`aspect-[4/3] transition-opacity duration-1000 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`Healthcare ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              ))}
              
              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Floating elements with animation */}
            <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-500" />
            
            {/* Floating badge */}
            <div className="absolute top-8 -left-4 animate-float">
              <Badge className="bg-green-500 text-white shadow-lg">
                <CheckCircle className="mr-1 h-3 w-3" />
                HIPAA Compliant
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center group cursor-pointer animate-in fade-in zoom-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Run Your Practice
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed for modern healthcare professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <div className="absolute bottom-4 right-4 h-12 w-12 rounded-lg bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built with Modern Technology
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Enterprise-grade architecture for reliability and scalability
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "FastAPI", emoji: "Py" },
              { label: "React", emoji: "⚛️" },
              { label: "TypeScript", emoji: "TS" },
              { label: "PostgreSQL", emoji: "🐘" }
            ].map((tech, index) => (
              <div 
                key={index}
                className="flex flex-col items-center gap-2 group animate-in fade-in zoom-in duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 cursor-pointer border-2 border-transparent group-hover:border-primary">
                  <span className="text-2xl font-bold text-primary">{tech.emoji}</span>
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{tech.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-blue-600 p-12 shadow-2xl animate-in fade-in zoom-in duration-700">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("/Images/img (5).jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center space-y-6 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of healthcare professionals using Prontivus to deliver 
              better patient care and streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/login")} 
                className="text-lg h-12 px-8 hover:scale-105 transition-transform duration-200 shadow-lg group"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/login")} 
                className="text-lg h-12 px-8 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200"
              >
                Schedule Demo
              </Button>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <div className="flex -space-x-2">
                {[
                  "/Images/img (6).jpg",
                  "/Images/img (7).jpg",
                  "/Images/img (8).jpg",
                  "/Images/img (9).jpg",
                  "/Images/img (10).jpg"
                ].map((img, index) => (
                  <div 
                    key={index} 
                    className="h-10 w-10 rounded-full border-2 border-white overflow-hidden hover:scale-125 hover:z-10 transition-transform duration-200 cursor-pointer"
                  >
                    <img src={img} alt={`User ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star 
                    key={i} 
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-white/90 font-medium">
                Trusted by 10,000+ healthcare professionals
              </p>
            </div>
            
            <p className="text-sm text-white/75 pt-4">
              No credit card required • Free 30-day trial • Cancel anytime
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="animate-in fade-in duration-500">
              <div className="mb-4">
                <img 
                  src="/Logo/Prontivus Horizontal.png" 
                  alt="Prontivus" 
                  className="h-30 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Modern healthcare management platform for the future of medicine.
              </p>
            </div>
            <div className="animate-in fade-in duration-500 delay-100">
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Updates</a></li>
              </ul>
            </div>
            <div className="animate-in fade-in duration-500 delay-200">
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">About</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Contact</a></li>
              </ul>
            </div>
            <div className="animate-in fade-in duration-500 delay-300">
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">LGPD</a></li>
                <li><a href="#" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-500">
            <p>© 2025 Prontivus. All rights reserved. Built with ❤️ for healthcare professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}