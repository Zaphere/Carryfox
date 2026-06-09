import { Link, useLocation } from "wouter";
import { MapPin, Calculator, BarChart3, Settings, Menu, X, ArrowRight } from "lucide-react";
import { Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoImg from "/carryfox-logo-transparent.png";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/services", label: "Services", icon: <MapPin className="w-4 h-4 mr-2" /> },
    { href: "/quote", label: "Get Quote", icon: <Calculator className="w-4 h-4 mr-2" /> },
    { href: "/track", label: "Track Vehicle", icon: <Truck className="w-4 h-4 mr-2" /> },
    { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { href: "/admin", label: "Admin", icon: <Settings className="w-4 h-4 mr-2" /> },
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
                data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/book">
              <Button className="font-semibold uppercase tracking-wider" data-testid="button-nav-book">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
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
            <div className="pt-4 border-t border-white/10">
              <Link href="/book" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full font-semibold uppercase tracking-wider" size="lg">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
