import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

function formatAddress(result: NominatimResult): string {
  const a = result.address;
  const parts: string[] = [];
  if (a.road) parts.push(a.road + (a.house_number ? ` ${a.house_number}` : ""));
  if (a.postcode || a.city || a.town || a.village) {
    const city = a.city ?? a.town ?? a.village ?? "";
    parts.push([a.postcode, city].filter(Boolean).join(" "));
  }
  if (a.state && a.state !== (a.city ?? a.town ?? a.village)) parts.push(a.state);
  return parts.join(", ") || result.display_name;
}

async function searchAddresses(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    countrycodes: "at",
    limit: "6",
    "accept-language": "de",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": "Carryfox.at/1.0 (info@carryfox.at)" },
  });
  if (!res.ok) throw new Error("Nominatim error");
  return res.json();
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Called with the coordinates of the picked suggestion, or null when the
   *  text is typed manually / cleared (no reliable coordinates available). */
  onCoords?: (coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoords,
  placeholder = "Start typing an address…",
  className,
  "data-testid": testId,
  id,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep internal query in sync if parent resets value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchAddresses(q);
      setResults(data);
      setOpen(data.length > 0);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    // Manual typing invalidates any previously picked coordinates.
    onCoords?.(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 300);
  };

  const pick = (result: NominatimResult) => {
    const formatted = formatAddress(result);
    setQuery(formatted);
    onChange(formatted);
    onCoords?.({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const clear = () => {
    setQuery("");
    onChange("");
    onCoords?.(null);
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          data-testid={testId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pl-9 pr-8",
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!loading && query.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-muted-foreground hover:text-white transition-colors"
              tabIndex={-1}
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/15 bg-card shadow-xl overflow-hidden">
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {results.map((r, i) => {
              const formatted = formatAddress(r);
              const isActive = i === activeIdx;
              return (
                <li
                  key={r.place_id}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => { e.preventDefault(); pick(r); }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm",
                    isActive ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-white"
                  )}
                  data-testid={`address-suggestion-${i}`}
                >
                  <MapPin className={cn("h-4 w-4 mt-0.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate">{formatted}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {r.address.country ?? "Austria"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/10 px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Powered by</span>
            <span className="text-[10px] text-muted-foreground font-semibold">OpenStreetMap Nominatim</span>
          </div>
        </div>
      )}
    </div>
  );
}
