import { Link, useLocation } from "wouter";
import { MapPin, Calculator, BarChart3, Settings, Menu, X, ArrowRight } from "lucide-react";
import { Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoImg from "/carryfox-logo-transparent.png";
import { useT } from "@/lib/i18n";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, lang, setLang } = useT();

  const links = [
    { href: "/services",   label: t.nav.services,   icon: <MapPin className="w-4 h-4 mr-2" /> },
    { href: "/quote",      label: t.nav.quote,       icon: <Calculator className="w-4 h-4 mr-2" /> },
    { href: "/track",      label: t.nav.track,       icon: <Truck className="w-4 h-4 mr-2" /> },
    { href: "/dashboard",  label: t.nav.dashboard,   icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { href: "/admin",      label: t.nav.admin,       icon: <Settings className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img
              src={logoImg}
              alt="Carryfox.at"
              className="h-14 w-auto rounded-lg px-2 py-1 bg-white/95"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${link.href.replace("/", "")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-bold">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-full transition-all ${lang === "en" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
                data-testid="button-lang-en"
              >
                EN
              </button>
              <button
                onClick={() => setLang("de")}
                className={`px-3 py-1.5 rounded-full transition-all ${lang === "de" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
                data-testid="button-lang-de"
              >
                DE
              </button>
            </div>

            <Link href="/book">
              <Button className="font-semibold uppercase tracking-wider" data-testid="button-nav-book">
                {t.nav.bookNow} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-background px-4 py-6">
          <div className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center text-lg font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Language:</span>
              <button onClick={() => setLang("en")} className={`text-sm font-bold px-2 py-1 rounded ${lang === "en" ? "text-primary" : "text-muted-foreground"}`}>EN</button>
              <span className="text-white/20">|</span>
              <button onClick={() => setLang("de")} className={`text-sm font-bold px-2 py-1 rounded ${lang === "de" ? "text-primary" : "text-muted-foreground"}`}>DE</button>
            </div>
            <div className="pt-4 border-t border-white/10">
              <Link href="/book" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full font-semibold uppercase tracking-wider" size="lg">
                  {t.nav.bookNow}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
