import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Check, Truck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useCreateBooking } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useT } from "@/lib/i18n";

const SERVICE_KEYS = [
  "apartment_move", "student_move", "office_move", "storage",
  "furniture", "clearance", "packing", "warehouse",
];
const SERVICE_PRICES = [350, 180, 800, 120, 200, 450, 150, 1200];

const schema = z.object({
  serviceType: z.string().min(1, "Select a service"),
  scheduledDate: z.string().min(1, "Select a date").refine(
    value => !Number.isNaN(new Date(value).getTime()),
    "Pick a valid date and time",
  ),
  pickupAddress: z.string().min(5, "Pickup address required"),
  destinationAddress: z.string().min(5, "Destination required"),
  customerName: z.string().min(2, "Name required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(6, "Phone required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Book() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  // Coordinates from the address autocomplete, stored with the booking so the
  // tracking map can plot the exact route without geocoding later.
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const { t } = useT();
  const b = t.book;

  const SERVICE_TYPES = SERVICE_KEYS.map((key, i) => ({
    key,
    label: b.serviceTypes[i],
    price: SERVICE_PRICES[i],
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceType: "",
      scheduledDate: "",
      pickupAddress: "",
      destinationAddress: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
  });

  const values = form.watch();
  const selectedService = SERVICE_TYPES.find(s => s.key === values.serviceType);
  const stepLabels = b.stepLabels;

  const next = async () => {
    let valid = false;
    if (step === 0) valid = await form.trigger(["serviceType"]);
    else if (step === 1) valid = await form.trigger(["scheduledDate", "pickupAddress", "destinationAddress"]);
    else valid = await form.trigger(["customerName", "customerEmail", "customerPhone"]);
    if (valid) setStep(s => Math.min(stepLabels.length - 1, s + 1));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const service = SERVICE_TYPES.find(s => s.key === data.serviceType);
    createBooking.mutate({
      data: {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        totalPrice: service?.price ?? 0,
        pickupLat: pickupCoords?.lat ?? null,
        pickupLng: pickupCoords?.lng ?? null,
        destinationLat: destinationCoords?.lat ?? null,
        destinationLng: destinationCoords?.lng ?? null,
      },
    }, {
      onSuccess: (res) => {
        setBookingId(res.id);
        setSubmitted(true);
      },
      onError: () => toast({ title: "Error", description: "Booking failed. Try again.", variant: "destructive" }),
    });
  });

  const copyReference = async () => {
    if (bookingId == null) return;
    try {
      await navigator.clipboard.writeText(String(bookingId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: `Your reference is #${bookingId}`, variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 border-2 border-primary"
          >
            <Truck className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            CONFIRMED
          </div>
          {/* Tracking ticket — the reference the customer needs to track */}
          <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{b.bookingRef}</p>
            <button
              type="button"
              onClick={copyReference}
              className="mx-auto flex items-center gap-3 rounded-lg px-3 py-1 transition-colors hover:bg-white/5"
              data-testid="button-copy-reference"
              title="Copy reference"
            >
              <span className="text-4xl font-black text-primary tracking-tight">#{bookingId}</span>
              {copied
                ? <Check className="h-5 w-5 text-green-400" />
                : <Copy className="h-5 w-5 text-muted-foreground" />}
            </button>
            <p className="text-[11px] text-muted-foreground mt-1" data-testid="text-reference-hint">
              {copied ? "Copied to clipboard" : "Click to copy — you'll need this to track your booking"}
            </p>
          </div>
          <p className="text-muted-foreground text-lg mb-2">{b.successTitle}</p>
          <p className="text-muted-foreground mb-2">{selectedService?.label}</p>
          <p className="text-3xl font-black text-primary mb-8">€{selectedService?.price}</p>
          <p className="text-muted-foreground mb-8 text-sm">{b.successSub}</p>
          <div className="flex gap-4 justify-center">
            <Link href={bookingId != null ? `/track?id=${bookingId}` : "/track"}>
              <Button size="lg" data-testid="button-post-booking-track">{b.trackBooking} <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white/20">{b.backHome}</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {b.badge}
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">
            {b.h1a}<br /><span className="text-primary">{b.h1b}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{b.sub}</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i === step ? "bg-primary text-white" : i < step ? "bg-primary/30 text-primary" : "bg-white/10 text-white/40"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < stepLabels.length - 1 && <div className={`h-px w-12 md:w-20 ${i < step ? "bg-primary/50" : "bg-white/10"}`} />}
            </div>
          ))}
          <span className="ml-4 text-sm text-muted-foreground">{stepLabels[step]}</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={onSubmit}>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-bold mb-1 uppercase tracking-wider">{b.selectService}</h3>
                    <p className="text-muted-foreground text-sm mb-5">{b.selectServiceNote}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SERVICE_TYPES.map(s => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => form.setValue("serviceType", s.key)}
                          className={`text-left rounded-xl border p-4 transition-all ${values.serviceType === s.key ? "border-primary bg-primary/20" : "border-white/10 bg-background/50 hover:border-white/30"}`}
                          data-testid={`button-service-${s.key}`}
                        >
                          <p className={`font-bold text-sm mb-1 ${values.serviceType === s.key ? "text-primary" : "text-white"}`}>{s.label}</p>
                          <p className="text-primary font-black">€{s.price}<span className="text-xs font-normal text-muted-foreground">/from</span></p>
                        </button>
                      ))}
                    </div>
                    {form.formState.errors.serviceType && (
                      <p className="text-red-400 text-sm mt-2">{form.formState.errors.serviceType.message}</p>
                    )}
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.scheduledDate}</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              value={field.value ? field.value.split("T")[0] : ""}
                              onChange={e => {
                                const time = field.value?.split("T")[1] ?? "09:00";
                                field.onChange(e.target.value ? `${e.target.value}T${time}` : "");
                              }}
                              className="flex h-10 w-full rounded-md border border-white/20 bg-background/50 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              style={{ colorScheme: "dark" }}
                              data-testid="input-date"
                            />
                            <input
                              type="time"
                              value={field.value ? (field.value.split("T")[1] ?? "09:00") : "09:00"}
                              onChange={e => {
                                const date = field.value?.split("T")[0] ?? "";
                                // Ignore a cleared/partial time so we never write "2026-10-16T" (invalid).
                                if (date && e.target.value) field.onChange(`${date}T${e.target.value}`);
                              }}
                              className="flex h-10 w-full rounded-md border border-white/20 bg-background/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              style={{ colorScheme: "dark" }}
                              data-testid="input-time"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.pickupAddress}</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onCoords={setPickupCoords}
                            placeholder="z.B. Mariahilfer Str. 45, 1060 Wien"
                            className="bg-background/50 border-white/20"
                            data-testid="input-pickup"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.destinationAddress}</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onCoords={setDestinationCoords}
                            placeholder="z.B. Praterstr. 15, 1020 Wien"
                            className="bg-background/50 border-white/20"
                            data-testid="input-destination"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.notes}</FormLabel>
                        <FormControl><Input placeholder={b.notesPlaceholder} {...field} className="bg-background/50 border-white/20" data-testid="input-notes" /></FormControl>
                      </FormItem>
                    )} />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.fullName}</FormLabel>
                        <FormControl><Input placeholder="Max Mustermann" {...field} className="bg-background/50 border-white/20" data-testid="input-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.email}</FormLabel>
                        <FormControl><Input type="email" placeholder="max@email.at" {...field} className="bg-background/50 border-white/20" data-testid="input-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">{b.phone}</FormLabel>
                        <FormControl><Input type="tel" placeholder="+43 676 123 4567" {...field} className="bg-background/50 border-white/20" data-testid="input-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{b.reviewTitle}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">{b.service}</span><span className="text-white font-semibold">{selectedService?.label}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{b.date}</span><span className="text-white">{values.scheduledDate ? new Date(values.scheduledDate).toLocaleDateString("de-AT") : "–"}</span></div>
                        <div className="flex justify-between border-t border-white/10 pt-2 font-bold"><span className="text-muted-foreground">Total</span><span className="text-primary text-lg">€{selectedService?.price}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <Button type="button" variant="outline" className="border-white/20" onClick={() => setStep(s => s - 1)} data-testid="button-prev-step">
                    <ArrowLeft className="h-4 w-4 mr-2" /> {b.back}
                  </Button>
                )}
                {step < 2 ? (
                  <Button type="button" onClick={next} className="flex-1" data-testid="button-next-step">
                    {b.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:shadow-[0_0_40px_rgba(255,90,0,0.5)]" disabled={createBooking.isPending} data-testid="button-confirm-booking">
                    {createBooking.isPending ? b.confirming : b.confirm} <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
