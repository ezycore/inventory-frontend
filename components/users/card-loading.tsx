import { Card } from "@/ui/components/card";

/**
 * Skeleton loading card matching the UserCardView layout.
 */
const UserCardLoading = () => {
  return (
    <Card className="relative overflow-hidden border-border/50 animate-pulse">
      {/* Status indicator strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted" />

      <div className="p-5">
        {/* Header: Avatar + Identity + Actions */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-muted" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-muted" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-40 bg-muted rounded" />
          </div>

          {/* Menu icon skeleton */}
          <div className="h-8 w-8 bg-muted rounded-md shrink-0" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <div className="h-5 w-16 bg-muted rounded-md" />
          <div className="h-5 w-14 bg-muted rounded-full" />
          <div className="h-5 w-18 bg-muted rounded-md" />
        </div>

        {/* Info rows */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-muted rounded shrink-0" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-muted rounded shrink-0" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5">
          <div className="h-3 w-3 bg-muted rounded shrink-0" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
    </Card>
  );
};

export default UserCardLoading;
