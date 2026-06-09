import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Check, Truck, Package, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useCreateQuote } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const schema = z.object({
  customerName: z.string().min(2, "Name required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(6, "Phone required"),
  pickupAddress: z.string().min(5, "Pickup address required"),
  destinationAddress: z.string().min(5, "Destination required"),
  apartmentSize: z.string(),
  rooms: z.coerce.number().min(1).max(20),
  floorPickup: z.coerce.number().min(0).max(50),
  floorDestination: z.coerce.number().min(0).max(50),
  hasElevator: z.boolean(),
  needsStorage: z.boolean(),
  needsPacking: z.boolean(),
  needsAssembly: z.boolean(),
  urgencyLevel: z.string(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const APARTMENT_SIZES = ["studio", "1br", "2br", "3br", "4br+"];
const URGENCY = [
  { key: "standard", label: "Standard", desc: "3-5 days notice", multiplier: 1 },
  { key: "express", label: "Express", desc: "24-48h notice", multiplier: 1.3 },
  { key: "emergency", label: "Emergency", desc: "Same day", multiplier: 1.6 },
];

function estimatePrice(d: Partial<FormData>) {
  let base = 200;
  base += (d.rooms ?? 1) * 80;
  if (!d.hasElevator) base += ((d.floorPickup ?? 0) + (d.floorDestination ?? 0)) * 30;
  if (d.needsStorage) base += 150;
  if (d.needsPacking) base += 120;
  if (d.needsAssembly) base += 80;
  if (d.urgencyLevel === "express") base *= 1.3;
  if (d.urgencyLevel === "emergency") base *= 1.6;
  return Math.round(base);
}

function getTruck(rooms: number) {
  if (rooms >= 4) return { label: "XL Truck (12t)", icon: "🚛" };
  if (rooms >= 3) return { label: "Large Truck (7.5t)", icon: "🚚" };
  if (rooms >= 2) return { label: "Small Truck (3.5t)", icon: "🚐" };
  return { label: "Van (1.5t)", icon: "🚌" };
}

export default function Quote() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const { toast } = useToast();
  const createQuote = useCreateQuote();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      apartmentSize: "2br",
      rooms: 2,
      floorPickup: 0,
      floorDestination: 0,
      hasElevator: false,
      needsStorage: false,
      needsPacking: false,
      needsAssembly: false,
      urgencyLevel: "standard",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      pickupAddress: "",
      destinationAddress: "",
      notes: "",
    },
  });

  const values = form.watch();
  const price = estimatePrice(values);
  const truck = getTruck(values.rooms ?? 1);
  const crew = (values.rooms ?? 1) >= 4 ? 4 : (values.rooms ?? 1) >= 2 ? 3 : 2;

  const steps = ["Move Details", "Extras & Urgency", "Your Info"];

  const next = async () => {
    let valid = false;
    if (step === 0) {
      valid = await form.trigger(["apartmentSize", "rooms", "floorPickup", "floorDestination", "pickupAddress", "destinationAddress"]);
    } else if (step === 1) {
      valid = true;
    } else {
      valid = await form.trigger(["customerName", "customerEmail", "customerPhone"]);
    }
    if (valid) setStep(s => Math.min(steps.length - 1, s + 1));
  };

  const onSubmit = form.handleSubmit(async (data) => {
    createQuote.mutate({ data }, {
      onSuccess: (q) => {
        setQuoteId(q.id);
        setSubmitted(true);
      },
      onError: () => {
        toast({ title: "Error", description: "Could not submit quote. Please try again.", variant: "destructive" });
      },
    });
  });

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 border-2 border-primary"
          >
            <Check className="h-12 w-12 text-primary" />
          </motion.div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-3">Quote #{quoteId} Sent!</h2>
          <p className="text-muted-foreground mb-2 text-lg">Estimated price: <span className="text-primary font-bold">€{price}</span></p>
          <p className="text-muted-foreground mb-8">We'll contact you within 30 minutes to confirm your booking.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" data-testid="button-post-quote-book">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white/20">Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">
            Smart Quote<br /><span className="text-primary">Calculator.</span>
          </h1>
          <p className="text-muted-foreground text-lg">Get a precise estimate in under 60 seconds.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i === step ? "bg-primary text-white" : i < step ? "bg-primary/30 text-primary" : "bg-white/10 text-white/40"}`}
                    data-testid={`step-indicator-${i}`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </button>
                  {i < steps.length - 1 && <div className={`h-px w-8 md:w-16 ${i < step ? "bg-primary/50" : "bg-white/10"}`} />}
                </div>
              ))}
              <span className="ml-4 text-sm text-muted-foreground">{steps[step]}</span>
            </div>

            <Form {...form}>
              <form onSubmit={onSubmit}>
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-sm text-muted-foreground uppercase tracking-wider mb-3 block">Apartment Size</label>
                          <div className="flex gap-2 flex-wrap">
                            {APARTMENT_SIZES.map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => form.setValue("apartmentSize", sz)}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${values.apartmentSize === sz ? "border-primary bg-primary/20 text-primary" : "border-white/20 bg-white/5 text-muted-foreground hover:border-white/40"}`}
                                data-testid={`button-size-${sz}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                        <FormField control={form.control} name="rooms" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Rooms</FormLabel>
                            <FormControl><Input type="number" min={1} max={20} {...field} className="bg-card border-white/20" data-testid="input-rooms" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="floorPickup" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Pickup Floor</FormLabel>
                            <FormControl><Input type="number" min={0} max={50} {...field} className="bg-card border-white/20" data-testid="input-floor-pickup" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="floorDestination" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Destination Floor</FormLabel>
                            <FormControl><Input type="number" min={0} max={50} {...field} className="bg-card border-white/20" data-testid="input-floor-dest" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-card p-4">
                          <input
                            type="checkbox"
                            id="elevator"
                            checked={values.hasElevator}
                            onChange={e => form.setValue("hasElevator", e.target.checked)}
                            className="h-4 w-4 accent-primary"
                            data-testid="checkbox-elevator"
                          />
                          <label htmlFor="elevator" className="text-sm text-white cursor-pointer">Elevator available</label>
                        </div>
                        <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Pickup Address</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Start typing pickup address…"
                                className="bg-card border-white/20"
                                data-testid="input-pickup"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Destination Address</FormLabel>
                            <FormControl>
                              <AddressAutocomplete
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Start typing destination address…"
                                className="bg-card border-white/20"
                                data-testid="input-destination"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <label className="text-sm text-muted-foreground uppercase tracking-wider mb-3 block">Extra Services</label>
                        <div className="space-y-3">
                          {[
                            { key: "needsPacking", label: "Packing Service", desc: "+€120" },
                            { key: "needsAssembly", label: "Furniture Assembly", desc: "+€80" },
                            { key: "needsStorage", label: "Storage Needed", desc: "+€150" },
                          ].map(opt => (
                            <label
                              key={opt.key}
                              className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all ${values[opt.key as keyof FormData] ? "border-primary/50 bg-primary/10" : "border-white/10 bg-card hover:border-white/20"}`}
                              data-testid={`toggle-${opt.key}`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={!!values[opt.key as keyof FormData]}
                                  onChange={e => form.setValue(opt.key as any, e.target.checked)}
                                  className="h-4 w-4 accent-primary"
                                />
                                <span className="font-medium text-white">{opt.label}</span>
                              </div>
                              <span className="text-primary font-semibold text-sm">{opt.desc}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground uppercase tracking-wider mb-3 block">Urgency Level</label>
                        <div className="grid grid-cols-3 gap-3">
                          {URGENCY.map(u => (
                            <button
                              key={u.key}
                              type="button"
                              onClick={() => form.setValue("urgencyLevel", u.key)}
                              className={`rounded-lg border p-4 text-left transition-all ${values.urgencyLevel === u.key ? "border-primary bg-primary/20" : "border-white/10 bg-card hover:border-white/20"}`}
                              data-testid={`button-urgency-${u.key}`}
                            >
                              <p className={`font-bold text-sm mb-1 ${values.urgencyLevel === u.key ? "text-primary" : "text-white"}`}>{u.label}</p>
                              <p className="text-xs text-muted-foreground">{u.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Notes (optional)</FormLabel>
                          <FormControl><Input placeholder="Special instructions..." {...field} className="bg-card border-white/20" data-testid="input-notes" /></FormControl>
                        </FormItem>
                      )} />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Full Name</FormLabel>
                          <FormControl><Input placeholder="Max Mustermann" {...field} className="bg-card border-white/20" data-testid="input-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Email</FormLabel>
                          <FormControl><Input type="email" placeholder="max@email.at" {...field} className="bg-card border-white/20" data-testid="input-email" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Phone</FormLabel>
                          <FormControl><Input type="tel" placeholder="+43 676 123 4567" {...field} className="bg-card border-white/20" data-testid="input-phone" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <Button type="button" variant="outline" className="border-white/20" onClick={() => setStep(s => s - 1)} data-testid="button-prev-step">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button type="button" onClick={next} className="flex-1" data-testid="button-next-step">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1 shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:shadow-[0_0_40px_rgba(255,90,0,0.5)]" disabled={createQuote.isPending} data-testid="button-submit-quote">
                      {createQuote.isPending ? "Submitting..." : "Get My Quote"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Live Price Panel */}
          <div className="space-y-4">
            <motion.div
              className="rounded-xl border border-primary/30 bg-card p-6 sticky top-24"
              animate={{ borderColor: ["rgba(255,100,0,0.3)", "rgba(255,100,0,0.6)", "rgba(255,100,0,0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Live Estimate</p>
              <motion.p
                key={price}
                initial={{ scale: 1.1, color: "#ff6400" }}
                animate={{ scale: 1, color: "#ff6400" }}
                className="text-5xl font-black text-primary mb-1"
              >
                €{price}
              </motion.p>
              <p className="text-xs text-muted-foreground mb-6">Final price confirmed after booking</p>

              <div className="space-y-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-semibold text-white">{truck.icon} {truck.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Crew Size</p>
                    <p className="text-sm font-semibold text-white">{crew} professionals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Urgency</p>
                    <p className="text-sm font-semibold text-white capitalize">{values.urgencyLevel}</p>
                  </div>
                </div>
                {(values.needsPacking || values.needsAssembly || values.needsStorage) && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Add-ons</p>
                      <p className="text-sm font-semibold text-white">
                        {[values.needsPacking && "Packing", values.needsAssembly && "Assembly", values.needsStorage && "Storage"].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
