import React, { useEffect } from "react";
import { MaterialTable } from "./MaterialTable";
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

export const Materials = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('Materials component loaded');
  }, []);

  return (
    <div className="p-2">
      <QueryClientProvider client={queryClient}>
        <MaterialTable />
      </QueryClientProvider>
    </div>
  );
}; 