import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
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
const clerkPubKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "");
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;

function isValidClerkPublishableKey(key: string): boolean {
  if (!key || key.includes("REPLACE") || !/^pk_(test|live)_/.test(key)) return false;
  try {
    const payload = key.replace(/^pk_(test|live)_/, "");
    const padded =
      payload.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded).replace(/\$$/, "");
    return /^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}/.test(decoded);
  } catch {
    return false;
  }
}

const hasValidClerkKey = isValidClerkPublishableKey(clerkPubKey);

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

function AuthUnavailable() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-white/10 bg-[#131820] p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin sign-in is not configured</h1>
        <p className="mt-3 text-sm text-slate-300">
          Set real Clerk keys in the server <code className="text-orange-400">.env</code>, rebuild the frontend,
          then reload. Public pages still work without them.
        </p>
        <a href={`${basePath || "/"}`} className="mt-6 inline-block text-orange-400 hover:text-orange-300">
          Back to home
        </a>
      </div>
    </div>
  );
}

function ProductRoutes({ requireAuth }: { requireAuth: boolean }) {
  const gate = (page: ReactNode) =>
    requireAuth ? <RequireSignIn>{page}</RequireSignIn> : <AuthUnavailable />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/quote" component={Quote} />
        <Route path="/track" component={Track} />
        <Route path="/services" component={Services} />
        <Route path="/dashboard">{gate(<Dashboard />)}</Route>
        <Route path="/admin">{gate(<Admin />)}</Route>
        <Route path="/book" component={Book} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router({ requireAuth }: { requireAuth: boolean }) {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={requireAuth ? SignInPage : AuthUnavailable} />
      <Route path="/sign-up/*?" component={requireAuth ? SignUpPage : AuthUnavailable} />
      <Route>{() => <ProductRoutes requireAuth={requireAuth} />}</Route>
    </Switch>
  );
}

function AppProviders({
  children,
  withClerkListener,
}: {
  children: ReactNode;
  withClerkListener: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {withClerkListener ? <ClerkQueryClientCacheInvalidator /> : null}
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
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
      <AppProviders withClerkListener>
        <Router requireAuth />
      </AppProviders>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      {hasValidClerkKey ? (
        <ClerkApp />
      ) : (
        <AppProviders withClerkListener={false}>
          <Router requireAuth={false} />
        </AppProviders>
      )}
    </WouterRouter>
  );
}

export default App;
