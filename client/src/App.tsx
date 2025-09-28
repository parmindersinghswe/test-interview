import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Materials from "@/pages/Materials";
import MaterialDetails from "@/pages/MaterialDetails";
import Checkout from "@/pages/Checkout";
import MyPurchases from "@/pages/MyPurchases";
import AdminPanel from "@/pages/AdminPanel";
import TestLogin from "@/pages/TestLogin";
import Auth from "@/pages/Auth";
import Contact from "@/pages/Contact";
import HelpCenter from "@/pages/HelpCenter";
import About from "@/pages/About";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import Cart from "@/components/Cart";

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
          <Route path="/login" component={TestLogin} />
          <Route path="/auth" component={Auth} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/refund" component={RefundPolicy} />
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
