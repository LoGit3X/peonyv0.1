import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/vazirmatn/400.css"; // Regular weight
import "@fontsource/vazirmatn/700.css"; // Bold weight
import "@fontsource/vazirmatn/300.css"; // Light weight
import "@fontsource/vazirmatn/500.css"; // Medium weight
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { EnhancedToaster } from "@/components/ui/enhanced-toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <EnhancedToaster />
  </QueryClientProvider>
);
