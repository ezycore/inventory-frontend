// coding-standard: maintained
import { Card } from "@/ui/components/card";

/** Skeleton matching TagCardView's layout (no avatar — tags carry no image). */
const TagCardLoading = () => (
  <Card className="p-5 gap-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-6 w-28 bg-muted rounded-full" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
      <div className="h-8 w-8 bg-muted rounded-md" />
    </div>
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-muted rounded" />
      <div className="h-4 w-20 bg-muted rounded" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  </Card>
);

export default TagCardLoading;
