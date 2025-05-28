import React, { useEffect } from "react";
import { RecipeTable } from "./RecipeTable";
import { useToast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const Recipes = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('Recipes component loaded');
  }, []);

  return (
    <div className="p-4">
      <QueryClientProvider client={queryClient}>
        <RecipeTable />
      </QueryClientProvider>
    </div>
  );
}; 