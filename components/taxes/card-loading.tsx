// coding-standard: maintained
import { Card } from "@/ui/components/card";

const TaxCardLoading = () => {
  return (
    <Card className="overflow-hidden animate-pulse">
      {/* Top accent bar skeleton */}
      <div className="h-1 w-full bg-muted" />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="flex gap-2">
                <div className="h-4 w-14 bg-muted rounded-full" />
                <div className="h-4 w-18 bg-muted rounded-full" />
              </div>
            </div>
          </div>
          <div className="h-8 w-8 bg-muted rounded-md" />
        </div>

        {/* Rate highlight skeleton */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-7 w-14 bg-muted rounded" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </Card>
  );
};

export default TaxCardLoading;
