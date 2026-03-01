import { Card } from "@/ui/components/card";

/**
 * Skeleton loading card matching the BrandCardView layout.
 */
const BrandCardLoading = () => {
  return (
    <Card className="p-5 gap-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-5 w-14 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>

        {/* Menu icon skeleton */}
        <div className="h-8 w-8 bg-muted rounded-md" />
      </div>

      {/* Product count skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
    </Card>
  );
};

export default BrandCardLoading;
