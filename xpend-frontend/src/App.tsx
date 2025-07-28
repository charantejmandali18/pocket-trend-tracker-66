import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWrapper from "@/components/AuthWrapper";
import Layout from "@/components/Layout";
import { AppProvider } from "@/contexts/AppContext";
import Dashboard from "@/pages/Dashboard";
import Planning from "@/pages/Planning";
import AddTransaction from "@/pages/AddTransaction";
import ImportData from "@/pages/ImportData";
import Transactions from "@/pages/Transactions";
import EnhancedAccountsNew from "@/pages/EnhancedAccountsNew";
import Profile from "@/pages/Profile";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";

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
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="add" element={<AddTransaction />} />
                <Route path="import" element={<ImportData />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="accounts" element={<EnhancedAccountsNew />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppProvider>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
