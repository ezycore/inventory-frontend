// coding-standard: maintained
import React from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/ui/components/button";
import { isPermissionDeniedError } from "@/lib/api-client";

export interface ErrorBoundaryFallbackProps {
  error?: Error | { message?: string };
  onRetry?: () => void;
  title?: string;
  message?: string;
}

/**
 * A permission-denied query error is not retryable and is not "no data" — a
 * 403 rendered through the generic branch below used to show the raw backend
 * string plus a Retry button that could never succeed. Route it to its own
 * copy and drop the button instead.
 */
export function ErrorBoundaryFallback({
  error,
  onRetry,
  title = "Error loading data",
  message,
}: ErrorBoundaryFallbackProps) {
  if (isPermissionDeniedError(error)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">You don&apos;t have permission to view this</h3>
          <p className="text-muted-foreground">Ask an admin to grant you access if you need it.</p>
        </div>
      </div>
    );
  }

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
