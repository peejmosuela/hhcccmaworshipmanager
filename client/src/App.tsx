import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "@/pages/dashboard";
import SongsPage from "@/pages/songs";
import SetlistsPage from "@/pages/setlists";
import SetlistDetailPage from "@/pages/setlist-detail";
import MusiciansPage from "@/pages/musicians";
import StatisticsPage from "@/pages/statistics";
import ProjectionDisplayPage from "@/pages/projection-display";
import CalendarPage from "@/pages/calendar";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/songs" component={SongsPage} />
      <Route path="/setlists" component={SetlistsPage} />
      <Route path="/setlists/:id" component={SetlistDetailPage} />
      <Route path="/setlists/:id/present" component={ProjectionDisplayPage} />
      <Route path="/musicians" component={MusiciansPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/statistics" component={StatisticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
    
  }
if (!isAuthenticated) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", marginTop: "5rem" }}>
      <h1>HHCCMA Worship Manager</h1>
      <p>Please log in or register to continue</p>
      <div style={{ marginTop: "2rem" }}>
        <a href="/login" style={{ margin: "0 1rem", fontSize: "1.2rem", color: "#007bff" }}>Login</a>
        <a href="/register" style={{ margin: "0 1rem", fontSize: "1.2rem", color: "#007bff" }}>Register</a>
      </div>
    </div>
  );
}
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
