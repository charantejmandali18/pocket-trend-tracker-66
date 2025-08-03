import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWrapper from "@/components/AuthWrapperMicroservices";
import Layout from "@/components/Layout";
import { AppProvider } from "@/contexts/AppContext";
import Dashboard from "@/pages/Dashboard";
import AddTransaction from "@/pages/AddTransaction";
import Transactions from "@/pages/Transactions";
import Planning from "@/pages/Planning";
import ImportData from "@/pages/ImportData";
import Analytics from "@/pages/Analytics";
import Accounts from "@/pages/Accounts";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import OAuthCallback from "@/pages/OAuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWrapper>
          <AppProvider>
            <Routes>
              {/* OAuth callback route - outside of Layout to avoid auth wrapper */}
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="add" element={<AddTransaction />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="import" element={<ImportData />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </AppProvider>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
