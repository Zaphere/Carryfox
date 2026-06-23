import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Calculator, MapPin, Shield, Zap, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/* ── Animated counter ── */
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

/* ── Particle field ── */
function Particles({ count = 60 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      dur: Math.random() * 12 + 8,
      delay: Math.random() * -15,
      drift: (Math.random() - 0.5) * 30,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.current.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/60"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -40, 0],
            x: [0, p.drift, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Road scan line effect ── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
      style={{ background: "linear-gradient(90deg, transparent, rgba(255,100,0,0.6), transparent)" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Service cards ── */
const services = [
  { img: "/van-loading.png", pos: "center 40%", title: "Apartment Moves", desc: "Seamless residential relocation with zero stress." },
  { img: "/van-aerial.png",  pos: "center 35%", title: "Office Relocation", desc: "Minimal downtime, maximum precision for your business." },
  { img: "/van-mountain.png",pos: "center 50%", title: "Premium Storage", desc: "Secure, climate-controlled facilities across Austria." },
  { img: "/van-highway.png", pos: "center 40%", title: "Furniture Transport", desc: "White-glove handling for your most valuable pieces." },
];

/* ── Process steps ── */
const steps = [
  { num: "01", title: "Get a Quote", desc: "Fill in your move details and receive a live price in under 60 seconds.", icon: <Calculator className="h-6 w-6" /> },
  { num: "02", title: "Book Your Crew", desc: "Pick your date, confirm the quote, and we assign a specialist team.", icon: <Star className="h-6 w-6" /> },
  { num: "03", title: "Track in Real Time", desc: "Follow your driver live on the map — second-by-second GPS updates.", icon: <MapPin className="h-6 w-6" /> },
  { num: "04", title: "Move Complete", desc: "Unpacked, placed, done. We handle damage insurance on every job.", icon: <Shield className="h-6 w-6" /> },
];

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* Glitch text animation */
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] w-full flex items-center overflow-hidden">

        {/* Van image with parallax */}
        <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
          <img
            src="/hero-van.png"
            alt="Carryfox van driving under the Milky Way at night"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.6) saturate(1.1)" }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          {/* Orange tint on the right side to match brand */}
          <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent" />
        </motion.div>

        {/* Animated particles */}
        <Particles count={50} />

        {/* Animated horizontal grid lines */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
          {[15, 30, 50, 70, 85].map(y => (
            <div key={y} className="absolute left-0 right-0 h-px bg-primary/40" style={{ top: `${y}%` }} />
          ))}
          {[10, 25, 40, 60, 75, 90].map(x => (
            <div key={x} className="absolute top-0 bottom-0 w-px bg-primary/20" style={{ left: `${x}%` }} />
          ))}
        </div>

        {/* Hero copy */}
        <motion.div className="container relative z-10 mx-auto px-4 md:px-6" style={{ y: textY, opacity }}>
          <div className="max-w-4xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-md mb-8 uppercase tracking-widest"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Foxy Moves, Zero Stress
            </motion.div>

            {/* Main headline */}
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter text-white uppercase leading-none"
              >
                MODERN
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400 ${glitch ? "translate-x-[2px] opacity-90" : ""} transition-transform`}
              >
                MOVING
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter text-white uppercase leading-none"
              >
                AUSTRIA.
              </motion.h1>
            </div>

            {/* Sub-heading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-400 mt-8 mb-10 max-w-xl font-light leading-relaxed"
            >
              Real-time logistics command center for your next move.
              Live ETAs, surgical precision, and a fleet built for speed.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/quote">
                <Button
                  size="lg"
                  className="relative h-14 px-8 text-lg font-bold uppercase tracking-wider group overflow-hidden"
                  data-testid="button-hero-quote"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Instant Quote
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  {/* Shimmer */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{ x: ["-200%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
                  />
                </Button>
              </Link>
              <Link href="/track">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg font-bold uppercase tracking-wider border-white/25 hover:bg-white/5 backdrop-blur-sm"
                  data-testid="button-hero-track"
                >
                  Track Vehicle
                </Button>
              </Link>
            </motion.div>

            {/* Live fleet indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                </span>
                <span>Fleet live · Austria</span>
              </div>
              <span className="text-white/20">|</span>
              <span>5 active shipments right now</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* ════════════════════════════════════════════════════
          ANIMATED STATS STRIP
      ════════════════════════════════════════════════════ */}
      <section className="relative z-20 -mt-1 bg-black/70 backdrop-blur-xl border-y border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {[
              { to: 2500, suffix: "+", label: "Successful Moves" },
              { to: 98, suffix: "%", label: "Client Satisfaction" },
              { to: 24, suffix: "/7", label: "Active Support" },
              { to: 150, suffix: "+", label: "Commercial Clients" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-1"
              >
                <div className="text-4xl md:text-5xl font-black text-primary">
                  <Counter to={stat.to} suffix={stat.suffix} />
                </div>
                <div className="text-xs uppercase tracking-widest text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SERVICES
      ════════════════════════════════════════════════════ */}
      <section className="py-28 bg-background relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">What we do</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                Command<br />Your Move.
              </h2>
            </motion.div>
            <Link href="/services" className="mt-6 md:mt-0 flex items-center text-primary font-semibold hover:text-primary/80 uppercase tracking-wider text-sm group">
              All Services
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-white/10 overflow-hidden cursor-default aspect-[3/4]"
              >
                {/* Photo */}
                <img
                  src={s.img}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: s.pos }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                {/* Hover tint */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-500" />
                {/* Orange border glow on hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/40 transition-all duration-300" />

                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {s.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                    Learn more <ArrowRight className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          HOW IT WORKS — animated timeline
      ════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden bg-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,100,0,0.04)_0%,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Process</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">How It Works.</h2>
          </motion.div>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-orange-400"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step circle */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mb-6 h-24 w-24 rounded-full border-2 border-primary/30 bg-primary/10 flex flex-col items-center justify-center z-10"
                  >
                    <span className="text-xs text-primary/60 font-mono font-bold">{step.num}</span>
                    <div className="text-primary">{step.icon}</div>
                    {/* Pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          VAN SHOWCASE STRIP
      ════════════════════════════════════════════════════ */}
      <section className="relative h-80 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <img
            src="/van-mountain.png"
            alt="Carryfox van on mountain road at night"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 55%", filter: "brightness(0.45) saturate(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </motion.div>
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <p className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-tight">
              Austria's <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Premier</span> Fleet.
            </p>
            <p className="text-muted-foreground mt-3 text-lg">Professional crews. Modern vehicles. Every night.</p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          USPs — 3 columns
      ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8" />,
                title: "60-Second Quote",
                desc: "No waiting. Our algorithm prices your move in real time based on distance, crew size, and vehicle.",
              },
              {
                icon: <MapPin className="h-8 w-8" />,
                title: "Live GPS Tracking",
                desc: "Your driver's position updates every few seconds. Watch your belongings move on an interactive map.",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Fully Insured",
                desc: "Every job is covered by comprehensive damage insurance. Move with total peace of mind.",
              },
            ].map((usp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group flex gap-5 p-6 rounded-2xl border border-white/8 bg-card/50 hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className="shrink-0 h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {usp.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{usp.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{usp.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA FINALE
      ════════════════════════════════════════════════════ */}
      <section className="py-32 relative overflow-hidden">
        {/* Photo background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/van-highway.png"
            alt="Carryfox van on the highway at night"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 40%", filter: "brightness(0.3) saturate(0.8)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[100px] pointer-events-none z-10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <Particles count={25} />

        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-4 font-semibold">Ready when you are</p>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              Ready to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400">
                Deploy?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">
              Get a precise quote in 60 seconds. Command your move from our real-time dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button
                  size="lg"
                  className="relative h-16 px-12 text-xl font-black uppercase tracking-widest overflow-hidden group shadow-[0_0_40px_rgba(255,90,0,0.4)] hover:shadow-[0_0_70px_rgba(255,90,0,0.65)] transition-all duration-300"
                >
                  <span className="relative z-10">Initiate Booking</span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                    animate={{ x: ["-200%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
                  />
                </Button>
              </Link>
              <Link href="/quote">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold uppercase border-white/20 hover:bg-white/5">
                  Get Quote
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Floating CTA ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/quote">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              size="lg"
              className="rounded-full h-14 px-6 shadow-[0_4px_30px_rgba(255,90,0,0.35)] font-bold uppercase tracking-wide group"
              data-testid="button-floating-quote"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Get Quote
            </Button>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
