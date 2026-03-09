import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";

import Index from "./pages/Index";
import Decode from "./pages/Decode";
import Vault from "./pages/Vault";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {

  return (

    <QueryClientProvider client={queryClient}>

      <TooltipProvider>

        <Toaster />
        <Sonner />

        <BrowserRouter>

          <AuthProvider>

            <Routes>

              {/* Public Route */}

              <Route path="/auth" element={<Auth />} />

              {/* Protected Routes */}

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1">
                        <Index />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/decode"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1">
                        <Decode />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vault"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1">
                        <Vault />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1">
                        <SettingsPage />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Catch All */}

              <Route path="*" element={<NotFound />} />

            </Routes>

          </AuthProvider>

        </BrowserRouter>

      </TooltipProvider>

    </QueryClientProvider>

  );
};

export default App;