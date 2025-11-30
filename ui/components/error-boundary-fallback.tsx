import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/ui/components/button";

export interface ErrorBoundaryFallbackProps {
  error?: Error | { message?: string };
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function ErrorBoundaryFallback({ 
  error, 
  onRetry,
  title = "Error loading data",
  message,
}: ErrorBoundaryFallbackProps) {
  const errorMessage = message || error?.message || "Please try again later.";

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
