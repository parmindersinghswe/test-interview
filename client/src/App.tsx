import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";

const NotFound = React.lazy(() => import("@/pages/not-found"));
const Landing = React.lazy(() => import("@/pages/Landing"));
const Home = React.lazy(() => import("@/pages/Home"));
const Materials = React.lazy(() => import("@/pages/Materials"));
const MaterialDetails = React.lazy(() => import("@/pages/MaterialDetails"));
const Checkout = React.lazy(() => import("@/pages/Checkout"));
const MyPurchases = React.lazy(() => import("@/pages/MyPurchases"));
const AdminPanel = React.lazy(() => import("@/pages/AdminPanel"));
const TestLogin = React.lazy(() => import("@/pages/TestLogin"));
const Auth = React.lazy(() => import("@/pages/Auth"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const HelpCenter = React.lazy(() => import("@/pages/HelpCenter"));
const About = React.lazy(() => import("@/pages/About"));
const TermsOfService = React.lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = React.lazy(() => import("@/pages/PrivacyPolicy"));
const RefundPolicy = React.lazy(() => import("@/pages/RefundPolicy"));
const Cart = React.lazy(() => import("@/components/Cart"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAuthenticated: isUserAuthenticated, isLoading: isUserLoading } = useUserAuth();
  
  // Combined authentication state
  const isLoggedIn = isAuthenticated || isUserAuthenticated;
  const isLoadingAuth = isLoading || isUserLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          }
        >
          <Switch>
          {isLoadingAuth ? (
            <Route path="/">
              {() => (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </Route>
          ) : isLoggedIn ? (
            <>
              <Route path="/" component={Home} />
              <Route path="/cart" component={Cart} />
              <Route path="/my-purchases" component={MyPurchases} />
              <Route path="/admin" component={AdminPanel} />
            </>
          ) : (
            <>
              <Route path="/" component={Landing} />
              <Route path="/admin">
                {() => {
                  window.location.href = '/';
                  return null;
                }}
              </Route>
            </>
          )}
          <Route path="/materials" component={Materials} />
          <Route path="/materials/:id" component={MaterialDetails} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/login" component={Auth} />
          <Route path="/register" component={Auth} />
          <Route path="/admin-login" component={TestLogin} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/refund" component={RefundPolicy} />
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
