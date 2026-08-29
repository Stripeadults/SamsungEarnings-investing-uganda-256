import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Team from "./pages/Team";
import Mine from "./pages/Mine";
import Recharge from "./pages/Recharge";
import Withdraw from "./pages/Withdraw";
import MyProduct from "./pages/MyProduct";
import Records from "./pages/Records";
import Wallet from "./pages/Wallet";
import ChangePassword from "./pages/ChangePassword";
import AboutUs from "./pages/AboutUs";
import MissionCenter from "./pages/MissionCenter";
import Regulation from "./pages/Regulation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import MigrationBanner from "@/components/features/MigrationBanner";
import { skipMigration, hasPendingMigration } from "@/lib/migrate";

const queryClient = new QueryClient();

// For brand-new installs that have no localStorage data at all,
// mark migration as done immediately so the prompt never appears.
if (typeof window !== 'undefined' && localStorage.getItem('samsung_cloud_migrated_v1') !== 'done' && !hasPendingMigration()) {
  skipMigration();
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MigrationBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product" element={<Product />} />
          <Route path="/team" element={<Team />} />
          <Route path="/mine" element={<Mine />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/my-product" element={<MyProduct />} />
          <Route path="/records" element={<Records />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/mission" element={<MissionCenter />} />
          <Route path="/regulation" element={<Regulation />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
