import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ToastContainer } from "./components/Toast";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Submission from "./pages/Submission";
import NotificationSettings from "./pages/NotificationSettings";
import Pricing from "./pages/Pricing";
import SEERDataFetch from "./pages/SEERDataFetch";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/project/:id"} component={ProjectDetail} />
      <Route path={"/project/:id/submission"} component={Submission} />
      <Route path={"/settings/notifications"} component={NotificationSettings} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/seer-data"} component={SEERDataFetch} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <ToastContainer />
            <AnnouncementBanner />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
