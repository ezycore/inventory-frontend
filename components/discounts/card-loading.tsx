// coding-standard: maintained
import { Card } from "@/ui/components/card";

const DiscountCardLoading = () => {
  return (
    <Card className="p-5 gap-3 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="h-14 w-14 rounded-xl bg-muted shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-5 w-14 bg-muted rounded-full" />
          </div>
          <div className="h-3.5 w-40 bg-muted rounded" />
        </div>

        {/* Menu icon skeleton */}
        <div className="h-8 w-8 bg-muted rounded-md" />
      </div>

      {/* Badges skeleton */}
      <div className="flex items-center gap-2 pt-2">
        <div className="h-5 w-20 bg-muted rounded-full" />
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </Card>
  );
};

export default DiscountCardLoading;
