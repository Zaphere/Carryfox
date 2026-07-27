import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { Home, GraduationCap, Building2, Warehouse, Armchair, Trash2, Package, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListServices } from "@workspace/api-client-react";
import { useT } from "@/lib/i18n";

const iconMap: Record<string, React.ReactNode> = {
  Home:          <Home          className="h-8 w-8" />,
  GraduationCap: <GraduationCap className="h-8 w-8" />,
  Building2:     <Building2     className="h-8 w-8" />,
  Warehouse:     <Warehouse     className="h-8 w-8" />,
  Armchair:      <Armchair      className="h-8 w-8" />,
  Trash2:        <Trash2        className="h-8 w-8" />,
  Package:       <Package       className="h-8 w-8" />,
  FactoryIcon:   <Factory       className="h-8 w-8" />,
};

const cardVariants = {
  hidden:  { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

export default function Services() {
  const { data: services, isLoading } = useListServices();
  const { t } = useT();
  const s = t.services;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with photo background */}
      <section className="relative h-[52vh] min-h-[400px] flex items-end overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <img
            src="/van-mountain.png"
            alt="Carryfox fleet on the road"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.45) saturate(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10 px-4 md:px-6 pb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-6 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {s.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
              {s.h1a}<br />
              <span className="text-primary">{s.h1b}</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">{s.sub}</p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services?.map((service, i) => (
                <motion.div
                  key={service.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative rounded-xl border border-border bg-card p-6 flex flex-col gap-4 cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/30"
                  data-testid={`card-service-${service.id}`}
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      {iconMap[service.icon] ?? <Package className="h-8 w-8" />}
                    </div>
                    <span className="text-2xl font-black text-primary">
                      €{service.basePrice}
                      <span className="text-sm font-normal text-muted-foreground">{s.fromLabel}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {service.estimatedDuration}
                  </div>

                  <ul className="space-y-2 flex-1">
                    {service.features.slice(0, 3).map((feature, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/quote">
                    <Button className="w-full group/btn mt-auto" data-testid={`button-book-service-${service.id}`}>
                      {t.nav.quote}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/van-loading.png"
            alt="Carryfox crew at work"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%", filter: "brightness(0.25) saturate(0.9)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
        </div>
        <div className="container relative z-10 mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">{s.ctaH2}</h2>
          <p className="text-gray-300 mb-8 text-lg">{s.ctaSub}</p>
          <Link href="/quote">
            <Button size="lg" className="h-14 px-10 text-lg font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(255,90,0,0.3)] hover:shadow-[0_0_50px_rgba(255,90,0,0.5)] transition-all">
              {s.ctaBtn} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
