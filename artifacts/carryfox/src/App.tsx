import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Redirect, Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Quote from "@/pages/Quote";
import Track from "@/pages/Track";
import Services from "@/pages/Services";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Book from "@/pages/Book";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY for Carryfox admin sign-in.");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#ff6400",
    colorForeground: "#f8fafc",
    colorMutedForeground: "#b8c0cc",
    colorDanger: "#ef4444",
    colorBackground: "#131820",
    colorInput: "#1c2430",
    colorInputForeground: "#f8fafc",
    colorNeutral: "#536071",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center px-4",
    cardBox: "bg-[#131820] border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold tracking-tight",
    headerSubtitle: "text-slate-300",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-slate-200 font-medium",
    footerActionLink: "text-orange-400 hover:text-orange-300",
    footerActionText: "text-slate-300",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-red-200",
    logoBox: "h-10",
    logoImage: "h-9 w-auto",
    socialButtonsBlockButton: "border-white/15 bg-slate-900 hover:bg-slate-800",
    formButtonPrimary: "bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold",
    formFieldInput: "bg-slate-900 border-white/15 text-white placeholder:text-slate-400",
    footerAction: "text-slate-300",
    dividerLine: "bg-white/10",
    alert: "border-red-400/40 bg-red-950/40",
    otpCodeFieldInput: "bg-slate-900 border-white/15 text-white",
    formFieldRow: "text-slate-100",
    main: "text-slate-100",
  },
};

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/admin`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/admin`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUserId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) {
        client.clear();
      }
      previousUserId.current = nextUserId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function RequireSignIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return <div className="min-h-[60vh] animate-pulse bg-muted/40" aria-label="Loading account" />;
  }
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }
  return <>{children}</>;
}

function ProductRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/quote" component={Quote} />
        <Route path="/track" component={Track} />
        <Route path="/services" component={Services} />
        <Route path="/dashboard">
          <RequireSignIn><Dashboard /></RequireSignIn>
        </Route>
        <Route path="/admin">
          <RequireSignIn><Admin /></RequireSignIn>
        </Route>
        <Route path="/book" component={Book} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={ProductRoutes} />
    </Switch>
  );
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/admin`}
      signUpFallbackRedirectUrl={`${basePath}/admin`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to manage Carryfox operations",
          },
        },
        signUp: {
          start: {
            title: "Create your admin account",
            subtitle: "Set up access to Carryfox operations",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
