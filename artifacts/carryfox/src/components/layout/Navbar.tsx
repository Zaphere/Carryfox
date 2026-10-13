import { Link, useLocation } from "wouter";
import { MapPin, Calculator, BarChart3, Settings, Menu, X, ArrowRight, Sun, Moon, Info } from "lucide-react";
import { Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoDark from "/logo-dark.png";
import logoLight from "/logo-light.png";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, lang, setLang } = useT();
  const { theme, toggle } = useTheme();

  const links = [
    { href: "/services",   label: t.nav.services,   icon: <MapPin className="w-4 h-4 mr-2" /> },
    { href: "/quote",      label: t.nav.quote,       icon: <Calculator className="w-4 h-4 mr-2" /> },
    { href: "/track",      label: t.nav.track,       icon: <Truck className="w-4 h-4 mr-2" /> },
    { href: "/about",      label: "About",            icon: <Info className="w-4 h-4 mr-2" /> },
    { href: "/dashboard",  label: t.nav.dashboard,   icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { href: "/admin",      label: t.nav.admin,       icon: <Settings className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Carryfox.at"
              className="h-14 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
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
            <div className="flex items-center rounded-full border border-border bg-muted/50 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang("en")}
                className={`rounded-full px-3 py-1 transition-all ${lang === "en" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="lang-en"
              >
                EN
              </button>
              <button
                onClick={() => setLang("de")}
                className={`rounded-full px-3 py-1 transition-all ${lang === "de" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="lang-de"
              >
                DE
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground transition-all hover:text-primary hover:border-primary/40"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link href="/book">
              <Button className="h-10 gap-2 font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,90,0,0.25)] hover:shadow-[0_0_30px_rgba(255,90,0,0.4)] transition-all" data-testid="button-book-now">
                {t.nav.bookNow} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border pb-4 pt-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="px-3 pt-2 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border bg-muted/50 p-0.5 text-xs font-semibold">
                <button onClick={() => setLang("en")} className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-primary text-white" : "text-muted-foreground"}`}>EN</button>
                <button onClick={() => setLang("de")} className={`rounded-full px-3 py-1 ${lang === "de" ? "bg-primary text-white" : "text-muted-foreground"}`}>DE</button>
              </div>
              <Link href="/book" onClick={() => setIsMobileMenuOpen(false)}>
                <Button size="sm" className="gap-2 font-bold uppercase tracking-wider">
                  {t.nav.bookNow} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
