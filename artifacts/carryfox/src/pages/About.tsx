import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Heart, Award, MapPin, Users, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import FloatingIcon from "@/components/FloatingIcon";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = to / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(Math.floor(start));
      if (start >= to) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const VALUES = [
  {
    icon: <Shield className="h-7 w-7" />,
    title: "Zero-Stress Promise",
    desc: "We treat every item as if it were our own. From packing to placement, your belongings are in safe hands every step of the way.",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
  },
  {
    icon: <Zap className="h-7 w-7" />,
    title: "Foxy Fast",
    desc: "Our real-time logistics engine dispatches crews in under 2 hours. Every minute matters — we move at the speed of your life.",
    color: "from-primary/20 to-orange-600/10",
    border: "border-primary/20",
    text: "text-primary",
  },
  {
    icon: <Heart className="h-7 w-7" />,
    title: "People First",
    desc: "Moving is personal. Our team is trained not just in logistics, but in empathy. We make a stressful day feel like the start of something great.",
    color: "from-rose-500/20 to-rose-600/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
  },
  {
    icon: <Award className="h-7 w-7" />,
    title: "Quality Guaranteed",
    desc: "4.9★ average across 2,500+ moves. We don't stop until you're smiling. Damage-free guarantee on every booking.",
    color: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
];

const MILESTONES = [
  { year: "2018", title: "Founded in Vienna", desc: "Two brothers, one van, and a mission to make moving less stressful for Austrians." },
  { year: "2020", title: "Expanded to 5 Cities", desc: "Grew to Graz, Linz, Salzburg, and Innsbruck. 100+ moves per month." },
  { year: "2022", title: "Live Tracking Launch", desc: "Became Austria's first moving company with real-time GPS tracking for customers." },
  { year: "2024", title: "1,000 Verified Reviews", desc: "Crossed the 1,000 review milestone with a 4.9★ rating. Zero damage claims." },
  { year: "2026", title: "2,500+ Moves & Growing", desc: "The most trusted moving platform in Austria. Available 24/7, across the whole country." },
];

const TEAM = [
  { name: "Maximilian Fuchs", role: "CEO & Co-Founder", initial: "M", rating: "★★★★★", note: "Former logistics director at DHL Austria" },
  { name: "Sophie Bauer",     role: "Head of Operations", initial: "S", rating: "★★★★★", note: "10 years optimizing last-mile delivery" },
  { name: "Lukas Werner",     role: "CTO & Co-Founder",  initial: "L", rating: "★★★★★", note: "Built real-time tracking from scratch" },
  { name: "Anna Hofer",       role: "Customer Experience", initial: "A", rating: "★★★★★", note: "Turned our NPS from 60 to 92 in 18 months" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FloatingIcon side="right" glow />

      {/* ── HERO ── */}
      <section className="relative py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/van-aerial.png"
            alt="Carryfox van aerial"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 40%", filter: "brightness(0.3) saturate(0.9)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>

        {/* Animated glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[120px] pointer-events-none z-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-md mb-8 uppercase tracking-widest">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Our Story
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-tighter uppercase leading-none mb-6 text-white">
              Born to Move<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400">
                Austria Forward.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              We didn't just build a moving company. We built the logistics experience Austria deserved — fast, transparent, and stress-free.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y border-border bg-card/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x divide-border">
            {[
              { to: 2500, suffix: "+", label: "Successful Moves", icon: <Truck className="h-5 w-5" /> },
              { to: 98,   suffix: "%", label: "Happy Customers",  icon: <Star className="h-5 w-5" /> },
              { to: 9,    suffix: "",  label: "Cities in Austria", icon: <MapPin className="h-5 w-5" /> },
              { to: 47,   suffix: "+", label: "Expert Movers",    icon: <Users className="h-5 w-5" /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4 space-y-1"
              >
                <div className="flex justify-center text-primary mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-black text-primary">
                  <Counter to={stat.to} suffix={stat.suffix} />
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-4 font-semibold">Our Mission</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 text-foreground">
                Foxy Moves,<br />
                <span className="text-primary">Zero Stress.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Moving is one of life's biggest moments. We believe it shouldn't be one of its most stressful ones. Every system we built, every driver we hired, and every feature we shipped has one goal: make your move feel effortless.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                From the moment you get a quote to the moment your last box is placed, Carryfox is beside you — with real-time GPS, direct driver communication, and a crew that actually cares.
              </p>
              <Link href="/book">
                <Button size="lg" className="gap-3 font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(255,90,0,0.3)] hover:shadow-[0_0_50px_rgba(255,90,0,0.5)] transition-all">
                  Book Your Move <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                <img
                  src="/van-loading.png"
                  alt="Carryfox crew loading a van"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.9) saturate(1.1)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-2xl px-4 py-3 border border-border">
                    <div className="flex">
                      {"★★★★★".split("").map((_, i) => (
                        <span key={i} className="text-yellow-400 text-sm">★</span>
                      ))}
                    </div>
                    <p className="text-white text-sm font-semibold">4.9 · 2,500+ verified moves</p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-primary rounded-2xl px-5 py-4 shadow-[0_0_40px_rgba(255,90,0,0.5)]"
              >
                <p className="text-white text-xs font-bold uppercase tracking-wider">Austria's #1</p>
                <p className="text-white text-2xl font-black">Moving App</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-24 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">What We Stand For</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
              Our Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className={`group relative rounded-2xl border ${v.border} bg-gradient-to-br ${v.color} p-8 overflow-hidden transition-all duration-300`}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border ${v.border} bg-card/80 ${v.text} mb-5`}>
                  {v.icon}
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-3">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Our Journey</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
              How We Got Here
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />
            <div className="space-y-12">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6 }}
                  className={`relative flex flex-col md:flex-row gap-6 md:gap-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Year badge — centre on desktop */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,90,0,0.5)]">
                      <span className="text-white text-[10px] font-black">{m.year.slice(2)}</span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`ml-16 md:ml-0 md:w-5/12 rounded-2xl border border-border bg-card p-6 shadow-sm ${i % 2 === 0 ? "md:text-right md:mr-auto" : "md:ml-auto"}`}>
                    <span className="inline-block text-primary font-black text-lg mb-2">{m.year}</span>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">{m.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden md:block md:w-5/12" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-24 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">The People Behind the Move</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
              Meet the Team
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(255,90,0,0.12)]"
              >
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-3xl group-hover:scale-110 transition-transform duration-300">
                  {member.initial}
                </div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight mb-1">{member.name}</h3>
                <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-3">{member.role}</p>
                <div className="text-yellow-400 text-xs mb-2">{member.rating}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/van-highway.png"
            alt="Open road"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </div>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none z-0"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-4 font-semibold">Ready to Move?</p>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none text-white">
              Let's Make<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400">
                Your Move.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
              Get a quote in 60 seconds. Book in 2 minutes. Relax — we'll handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button
                  size="lg"
                  className="h-16 px-12 text-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,90,0,0.35)] hover:shadow-[0_0_60px_rgba(255,90,0,0.55)] transition-all"
                >
                  Book Now <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/quote">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 text-xl font-bold uppercase tracking-widest border-border hover:bg-background/5 backdrop-blur-sm text-white"
                >
                  Get Free Quote
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
