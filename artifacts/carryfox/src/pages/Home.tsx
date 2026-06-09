import { motion } from "framer-motion";
import { ArrowRight, Box, Clock, ShieldCheck, MapPin, Truck, ChevronRight, Calculator } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const services = [
  { title: "Apartment Moves", image: "/images/service-apartment.png", desc: "Seamless residential relocation with zero stress." },
  { title: "Office Relocation", image: "/images/service-office.png", desc: "Minimal downtime, maximum precision for your business." },
  { title: "Premium Storage", image: "/images/service-storage.png", desc: "Secure, climate-controlled facilities." },
  { title: "Furniture Transport", image: "/images/service-furniture.png", desc: "White-glove handling for your most valuable pieces." },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.png" 
            alt="Futuristic moving truck in Vienna at night" 
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                FOXY MOVES, ZERO STRESS
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6 uppercase">
                MODERN MOVING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                  & LOGISTICS
                </span><br />
                ACROSS AUSTRIA.
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-light">
                The real-time logistics command center for your next move. 
                Live ETAs, surgical precision, and a fleet engineered for speed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/quote">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold uppercase tracking-wider group" data-testid="button-hero-quote">
                    Get Instant Quote
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/track">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold uppercase tracking-wider border-white/20 hover:bg-white/5" data-testid="button-hero-track">
                    Track Vehicle
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Metrics */}
      <section className="border-y border-white/10 bg-black/40 backdrop-blur-sm relative z-20 -mt-10">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-4xl font-black text-primary">2,500+</span>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Successful Moves</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-4xl font-black text-primary">98%</span>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Client Satisfaction</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-4xl font-black text-primary">24/7</span>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Active Support</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-4xl font-black text-primary">150+</span>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Commercial Clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Teaser */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">Command Your Move</h2>
              <p className="text-gray-400 max-w-xl text-lg">From residential shifts to heavy corporate logistics, we deploy specialized fleets for every mission.</p>
            </div>
            <Link href="/services" className="mt-6 md:mt-0 flex items-center text-primary font-semibold hover:text-primary/80 uppercase tracking-wider">
              View All Services <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-card"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-300 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    {service.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">Ready to Deploy?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Get a precise quote in 60 seconds and command your moving logistics from our real-time dashboard.
          </p>
          <Link href="/book">
            <Button size="lg" className="h-16 px-10 text-xl font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(255,90,0,0.4)] hover:shadow-[0_0_60px_rgba(255,90,0,0.6)] transition-all">
              Initiate Booking
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Sticky floating CTA */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link href="/quote">
          <Button size="lg" className="rounded-full h-16 px-8 shadow-2xl shadow-primary/20 font-bold uppercase tracking-wider group" data-testid="button-floating-quote">
            <Calculator className="mr-2 h-5 w-5" />
            Get Quote
          </Button>
        </Link>
      </div>
    </div>
  );
}
