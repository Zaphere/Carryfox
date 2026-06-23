import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Calculator, MapPin, Shield, Zap, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

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
          animate={{ y: [0, -40, 0], x: [0, p.drift, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Service card images ── */
const SERVICE_IMGS = [
  { img: "/van-loading.png",  pos: "center 40%" },
  { img: "/van-aerial.png",   pos: "center 35%" },
  { img: "/van-mountain.png", pos: "center 50%" },
  { img: "/van-highway.png",  pos: "center 40%" },
];

const STEP_ICONS = [
  <Calculator className="h-6 w-6" />,
  <Star className="h-6 w-6" />,
  <MapPin className="h-6 w-6" />,
  <Shield className="h-6 w-6" />,
];

const USP_ICONS = [
  <Zap className="h-8 w-8" />,
  <MapPin className="h-8 w-8" />,
  <Shield className="h-8 w-8" />,
];

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const { t } = useT();
  const h = t.home;

  const STATS = [
    { to: 2500, suffix: "+", label: h.statsLabels[0] },
    { to: 98, suffix: "%",  label: h.statsLabels[1] },
    { to: 24, suffix: "/7", label: h.statsLabels[2] },
    { to: 150, suffix: "+", label: h.statsLabels[3] },
  ];

  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ════ HERO ════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] w-full flex items-center overflow-hidden">

        <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
          <img
            src="/hero-van.png"
            alt="Carryfox van driving under the Milky Way at night"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.6) saturate(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent" />
        </motion.div>

        <Particles count={50} />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
          {[15, 30, 50, 70, 85].map(y => (
            <div key={y} className="absolute left-0 right-0 h-px bg-primary/40" style={{ top: `${y}%` }} />
          ))}
          {[10, 25, 40, 60, 75, 90].map(x => (
            <div key={x} className="absolute top-0 bottom-0 w-px bg-primary/20" style={{ left: `${x}%` }} />
          ))}
        </div>

        <motion.div className="container relative z-10 mx-auto px-4 md:px-6" style={{ y: textY, opacity }}>
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-md mb-8 uppercase tracking-widest"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {h.badge}
            </motion.div>

            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter text-white uppercase leading-none"
              >
                {h.h1a}
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400 ${glitch ? "translate-x-[2px] opacity-90" : ""} transition-transform`}
              >
                {h.h1b}
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-[clamp(3rem,9vw,8rem)] font-black tracking-tighter text-white uppercase leading-none"
              >
                {h.h1c}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-400 mt-8 mb-10 max-w-xl font-light leading-relaxed"
            >
              {h.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/quote">
                <Button size="lg" className="relative h-14 px-8 text-lg font-bold uppercase tracking-wider group overflow-hidden" data-testid="button-hero-quote">
                  <span className="relative z-10 flex items-center gap-2">
                    {h.ctaQuote}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{ x: ["-200%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
                  />
                </Button>
              </Link>
              <Link href="/track">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold uppercase tracking-wider border-white/25 hover:bg-white/5 backdrop-blur-sm" data-testid="button-hero-track">
                  {h.ctaTrack}
                </Button>
              </Link>
            </motion.div>

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
                <span>{h.liveFleet}</span>
              </div>
              <span className="text-white/20">|</span>
              <span>{h.liveShipments}</span>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* ════ STATS ════ */}
      <section className="relative z-20 -mt-1 bg-black/70 backdrop-blur-xl border-y border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {STATS.map((stat, i) => (
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

      {/* ════ SERVICES ════ */}
      <section className="py-28 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">{h.servicesSectionLabel}</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                {h.servicesH2a}<br />{h.servicesH2b}
              </h2>
            </motion.div>
            <Link href="/services" className="mt-6 md:mt-0 flex items-center text-primary font-semibold hover:text-primary/80 uppercase tracking-wider text-sm group">
              {h.servicesLink}
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICE_IMGS.map((s, i) => {
              const svc = h.steps[i] ? null : null; // services have their own titles below
              const svcTitles = ["Apartment Moves", "Office Relocation", "Premium Storage", "Furniture Transport"];
              const svcDescs = [
                "Seamless residential relocation with zero stress.",
                "Minimal downtime, maximum precision for your business.",
                "Secure, climate-controlled facilities across Austria.",
                "White-glove handling for your most valuable pieces.",
              ];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className="group relative rounded-2xl border border-white/10 overflow-hidden cursor-default aspect-[3/4]"
                >
                  <img
                    src={s.img}
                    alt={svcTitles[i]}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: s.pos }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-500" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/40 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{svcTitles[i]}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {svcDescs[i]}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                      {h.servicesLearnMore} <ArrowRight className="h-3 w-3 ml-0.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="py-28 relative overflow-hidden bg-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,100,0,0.04)_0%,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3 font-semibold">{h.processLabel}</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{h.processH2}</h2>
          </motion.div>

          <div className="relative">
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
              {h.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mb-6 h-24 w-24 rounded-full border-2 border-primary/30 bg-primary/10 flex flex-col items-center justify-center z-10"
                  >
                    <span className="text-xs text-primary/60 font-mono font-bold">0{i + 1}</span>
                    <div className="text-primary">{STEP_ICONS[i]}</div>
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

      {/* ════ SHOWCASE STRIP ════ */}
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
              {h.showcaseH2a} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">{h.showcaseH2b}</span> {h.showcaseH2c}
            </p>
            <p className="text-muted-foreground mt-3 text-lg">{h.showcaseSub}</p>
          </motion.div>
        </div>
      </section>

      {/* ════ USPs ════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {h.uspItems.map((usp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group flex gap-5 p-6 rounded-2xl border border-white/8 bg-card/50 hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className="shrink-0 h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {USP_ICONS[i]}
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

      {/* ════ CTA FINALE ════ */}
      <section className="py-32 relative overflow-hidden">
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
            <p className="text-primary text-xs uppercase tracking-[0.3em] mb-4 font-semibold">{h.ctaLabel}</p>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              {h.ctaH2a}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400">
                {h.ctaH2b}
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">{h.ctaSub}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button
                  size="lg"
                  className="h-16 px-12 text-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,90,0,0.35)] hover:shadow-[0_0_60px_rgba(255,90,0,0.55)] transition-all duration-300"
                  data-testid="button-cta-book"
                >
                  {h.ctaBook} <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/quote">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 text-xl font-bold uppercase tracking-widest border-white/20 hover:bg-white/5 backdrop-blur-sm"
                  data-testid="button-cta-quote"
                >
                  {h.ctaQuote2}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════ FLOATING QUICK-QUOTE CTA ════ */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link href="/quote">
            <Button
              size="lg"
              className="rounded-full shadow-[0_0_30px_rgba(255,90,0,0.4)] hover:shadow-[0_0_50px_rgba(255,90,0,0.6)] h-14 px-6 font-bold uppercase tracking-wider"
              data-testid="button-floating-quote"
            >
              <Calculator className="h-5 w-5 mr-2" />
              {h.ctaQuote}
            </Button>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
