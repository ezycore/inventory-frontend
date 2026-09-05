"use client";

import Image from "next/image";
import { cn } from "@/ui/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
import type {
  CardItemProps,
  CardFieldConfig,
  CardImageConfig,
  CardCustomAction,
} from "@/types/DataCard";

// ============ UTILITY FUNCTIONS ============

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

const getRoundedClass = (rounded: string): string => {
  const roundedMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  return roundedMap[rounded] || "rounded-lg";
};

const getShadowClass = (shadow: string): string => {
  const shadowMap: Record<string, string> = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };
  return shadowMap[shadow] || "shadow-sm";
};

const getCardSizeClasses = (size?: string, variant?: string): { padding: string; text: string; spacing: string } => {
  const sizeMap: Record<string, { padding: string; text: string; spacing: string }> = {
    sm: { 
      padding: variant === "compact" ? "p-2" : "p-2", 
      text: "[&_.card-title]:text-sm [&_.card-description]:text-xs",
      spacing: "[&_.card-header]:py-2 [&_.card-content]:py-1 [&_.card-footer]:py-2"
    },
    md: { 
      padding: variant === "compact" ? "p-4" : "", 
      text: "[&_.card-title]:text-base [&_.card-description]:text-sm",
      spacing: ""
    },
    lg: { 
      padding: variant === "compact" ? "p-6" : "p-2", 
      text: "[&_.card-title]:text-lg [&_.card-description]:text-base",
      spacing: "[&_.card-header]:py-5 [&_.card-content]:py-3 [&_.card-footer]:py-4"
    },
  };
  return sizeMap[size || "md"] || sizeMap.md;
};

// ============ ACTION BUTTONS ============

interface ActionButtonsProps {
  actions?: {
    editable?: boolean | { tooltip?: string };
    deletable?: boolean | { tooltip?: string };
    viewable?: boolean | { tooltip?: string };
  };
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  customActions?: CardCustomAction[];
  data?: any;
  variant?: "icons" | "dropdown" | "buttons";
}

function ActionButtons({
  actions,
  onEdit,
  onView,
  onDelete,
  customActions,
  data,
  variant = "icons",
}: ActionButtonsProps) {
  const hasEdit = actions?.editable && onEdit;
  const hasView = actions?.viewable && onView;
  const hasDelete = actions?.deletable && onDelete;
  // A card has no row cell and no toolbar of its own, so both per-row
  // placements land in the kebab. Dropping `"cell"` is what lost `/products`
  // its Print Label button the moment a merchant switched to card view
  // (QA-T1-E) — `header`/`footer` are page-level and stay out.
  const menuActions = customActions?.filter(
    (a) => a.placement === "menu" || a.placement === "cell",
  );
  const hasCustom = menuActions && menuActions.length > 0;

  if (!hasEdit && !hasView && !hasDelete && !hasCustom) return null;

  const getTooltip = (
    action: boolean | { tooltip?: string } | undefined,
    fallback: string
  ): string => {
    if (typeof action === "object" && action.tooltip) {
      return action.tooltip;
    }
    return fallback;
  };

  // Dropdown variant for compact cards
  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasView && (
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              {getTooltip(actions?.viewable, "View")}
            </DropdownMenuItem>
          )}
          {hasEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {getTooltip(actions?.editable, "Edit")}
            </DropdownMenuItem>
          )}
          {menuActions?.map((action, idx) => {
            const isDisabled =
              typeof action.disabled === "function"
                ? action.disabled(data)
                : action.disabled;
            return (
              <DropdownMenuItem
                key={idx}
                onClick={() => action.onClick?.(data)}
                disabled={isDisabled}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            );
          })}
          {hasDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {getTooltip(actions?.deletable, "Delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Icon buttons variant
  if (variant === "icons") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1">
          {hasView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onView}
                  className="h-8 w-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getTooltip(actions?.viewable, "View")}
              </TooltipContent>
            </Tooltip>
          )}
          {hasEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onEdit}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getTooltip(actions?.editable, "Edit")}
              </TooltipContent>
            </Tooltip>
          )}
          {menuActions?.map((action, idx) => {
            const isDisabled =
              typeof action.disabled === "function"
                ? action.disabled(data)
                : action.disabled;
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => action.onClick?.(data)}
                    disabled={isDisabled}
                    className="h-8 w-8"
                  >
                    {action.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{action.tooltip || action.label}</TooltipContent>
              </Tooltip>
            );
          })}
          {hasDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {getTooltip(actions?.deletable, "Delete")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full buttons variant
  return (
    <div className="flex items-center gap-2">
      {hasView && (
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )}
      {hasEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
      {hasDelete && (
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );
}

// ============ IMAGE COMPONENT ============

interface CardImageProps<TData> {
  data: TData;
  imageConfig?: CardImageConfig<TData>;
  className?: string;
}

function CardImage<TData>({ data, imageConfig, className }: CardImageProps<TData>) {
  if (!imageConfig) return null;

  const getSrc = (): string => {
    if (typeof imageConfig.src === "function") {
      return imageConfig.src(data);
    }
    const value = getNestedValue(data, imageConfig.src as string);
    // Handle array of images (take first thumbnail)
    if (Array.isArray(value) && value.length > 0) {
      return value[0]?.thumbnail?.url || value[0]?.url || "";
    }
    return value || "";
  };

  const getAlt = (): string => {
    if (!imageConfig.alt) return "";
    if (typeof imageConfig.alt === "string" && !imageConfig.alt.includes(".")) {
      return imageConfig.alt;
    }
    return getNestedValue(data, imageConfig.alt as string) || "";
  };

  const src = getSrc();
  const alt = getAlt();

  const aspectRatioMap: Record<string, string> = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[2/1]",
    portrait: "aspect-[3/4]",
  };

  const aspectClass = aspectRatioMap[imageConfig.aspectRatio || "video"];

  // Avatar variant
  if (imageConfig.asAvatar) {
    return (
      <div
        className={cn(
          "relative h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center",
          className
        )}
      >
        {src ? (
          <Image src={src} alt={alt} fill className="object-cover" unoptimized />
        ) : (
          <div className="text-muted-foreground text-sm font-medium">
            {typeof imageConfig.fallback === "function"
              ? imageConfig.fallback(data)
              : imageConfig.fallback || alt?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  // Standard image
  if (!src) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center",
          aspectClass,
          className
        )}
      >
        {typeof imageConfig.fallback === "function"
          ? imageConfig.fallback(data)
          : imageConfig.fallback || (
              <span className="text-muted-foreground text-sm">No Image</span>
            )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", aspectClass, className)}>
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  );
}

// ============ FIELD RENDERER ============

interface FieldRendererProps<TData> {
  data: TData;
  field: CardFieldConfig<TData>;
}

function FieldRenderer<TData>({ data, field }: FieldRendererProps<TData>) {
  const value = getNestedValue(data, field.key as string);

  // Custom render function
  if (field.render) {
    return <>{field.render(value, data)}</>;
  }

  // Badge variant
  if (field.isBadge) {
    const variant = field.badgeVariant
      ? field.badgeVariant(value)
      : "secondary";
    return <Badge variant={variant}>{String(value)}</Badge>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return <span className="text-sm">{value.length} items</span>;
  }

  // Handle objects
  if (typeof value === "object" && value !== null) {
    return <span className="text-sm">{JSON.stringify(value)}</span>;
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;
  }

  return <span className="text-sm">{String(value ?? "-")}</span>;
}

// ============ DEFAULT VARIANT ============

function DefaultCard<TData extends { _id: string }>({
  data,
  cardSize,
  cardClassName,
  enableCardHover,
  rounded = "lg",
  shadow = "sm",
  fields,
  imageConfig,
  actions,
  onEdit,
  onView,
  onDelete,
  customActions,
  selected,
  onSelect,
  selectable,
}: CardItemProps<TData>) {
  const titleField = fields?.find((f) => f.isTitle);
  const subtitleField = fields?.find((f) => f.isSubtitle);
  const bodyFields = fields?.filter((f) => !f.isTitle && !f.isSubtitle && !f.inFooter && !f.hidden);
  const footerFields = fields?.filter((f) => f.inFooter && !f.hidden);
  const sizeClasses = getCardSizeClasses(cardSize, "default");

  return (
    <Card
      className={cn(
        getRoundedClass(rounded),
        getShadowClass(shadow),
        sizeClasses.text,
        sizeClasses.spacing,
        enableCardHover &&
          "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        selected && "ring-2 ring-primary",
        cardClassName
      )}
    >
      {/* Image */}
      {imageConfig && imageConfig.position !== "background" && (
        <CardImage
          data={data}
          imageConfig={imageConfig}
          className="rounded-t-lg"
        />
      )}

      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {titleField && (
              <CardTitle className="text-base font-semibold truncate">
                <FieldRenderer data={data} field={titleField} />
              </CardTitle>
            )}
            {subtitleField && (
              <CardDescription className="mt-1">
                <FieldRenderer data={data} field={subtitleField} />
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectable && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(!!checked)}
                className="mr-1"
              />
            )}
            <ActionButtons
              actions={actions}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              customActions={customActions}
              data={data}
              variant="dropdown"
            />
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      {bodyFields && bodyFields.length > 0 && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {bodyFields.map((field, idx) => (
              <div
                key={idx}
                className={cn(
                  "space-y-1",
                  field.span === 2 && "col-span-2"
                )}
              >
                {field.label && (
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                )}
                <div className="text-sm font-medium">
                  <FieldRenderer data={data} field={field} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Footer */}
      {footerFields && footerFields.length > 0 && (
        <CardFooter className="pt-0 border-t mt-2">
          <div className="flex items-center justify-between w-full pt-3 gap-2">
            {footerFields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {field.label && (
                  <span className="text-xs text-muted-foreground">
                    {field.label}:
                  </span>
                )}
                <FieldRenderer data={data} field={field} />
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// ============ COMPACT VARIANT ============

function CompactCard<TData extends { _id: string }>({
  data,
  cardSize,
  cardClassName,
  enableCardHover,
  rounded = "md",
  shadow = "sm",
  fields,
  imageConfig,
  actions,
  onEdit,
  onView,
  onDelete,
  customActions,
  selected,
  onSelect,
  selectable,
}: CardItemProps<TData>) {
  const titleField = fields?.find((f) => f.isTitle);
  const subtitleField = fields?.find((f) => f.isSubtitle);
  const badgeField = fields?.find((f) => f.isBadge);
  const sizeClasses = getCardSizeClasses(cardSize, "compact");

  return (
    <Card
      className={cn(
        getRoundedClass(rounded),
        getShadowClass(shadow),
        sizeClasses.padding,
        sizeClasses.text,
        enableCardHover &&
          "transition-all duration-200 hover:shadow-md hover:bg-accent/5 cursor-pointer",
        selected && "ring-2 ring-primary bg-primary/5",
        cardClassName
      )}
    >
      <div className="flex items-center gap-3">
        {/* Selection checkbox */}
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(!!checked)}
          />
        )}

        {/* Avatar/Image */}
        {imageConfig && (
          <CardImage
            data={data}
            imageConfig={{ ...imageConfig, asAvatar: true }}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {titleField && (
              <span className="font-medium truncate">
                <FieldRenderer data={data} field={titleField} />
              </span>
            )}
            {badgeField && <FieldRenderer data={data} field={badgeField} />}
          </div>
          {subtitleField && (
            <p className="text-sm text-muted-foreground truncate">
              <FieldRenderer data={data} field={subtitleField} />
            </p>
          )}
        </div>

        {/* Actions */}
        <ActionButtons
          actions={actions}
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          customActions={customActions}
          data={data}
          variant="icons"
        />
      </div>
    </Card>
  );
}

// ============ DETAILED VARIANT ============

function DetailedCard<TData extends { _id: string }>({
  data,
  cardSize,
  cardClassName,
  enableCardHover,
  rounded = "xl",
  shadow = "md",
  fields,
  imageConfig,
  actions,
  onEdit,
  onView,
  onDelete,
  customActions,
  selected,
  onSelect,
  selectable,
}: CardItemProps<TData>) {
  const titleField = fields?.find((f) => f.isTitle);
  const subtitleField = fields?.find((f) => f.isSubtitle);
  const bodyFields = fields?.filter(
    (f) => !f.isTitle && !f.isSubtitle && !f.inFooter && !f.hidden
  );
  const footerFields = fields?.filter((f) => f.inFooter && !f.hidden);
  const sizeClasses = getCardSizeClasses(cardSize, "detailed");

  return (
    <Card
      className={cn(
        getRoundedClass(rounded),
        getShadowClass(shadow),
        sizeClasses.text,
        sizeClasses.spacing,
        "overflow-hidden",
        enableCardHover &&
          "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        selected && "ring-2 ring-primary",
        cardClassName
      )}
    >
      {/* Background gradient or image */}
      <div className="relative">
        {imageConfig ? (
          <CardImage
            data={data}
            imageConfig={{ ...imageConfig, aspectRatio: "wide" }}
            className="w-full"
          />
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        )}

        {/* Selection & Actions overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {selectable && (
            <div className="bg-background/80 backdrop-blur-sm rounded-md p-1">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(!!checked)}
              />
            </div>
          )}
          <div className="bg-background/80 backdrop-blur-sm rounded-md">
            <ActionButtons
              actions={actions}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              customActions={customActions}
              data={data}
              variant="dropdown"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        {titleField && (
          <CardTitle className="text-lg">
            <FieldRenderer data={data} field={titleField} />
          </CardTitle>
        )}
        {subtitleField && (
          <CardDescription>
            <FieldRenderer data={data} field={subtitleField} />
          </CardDescription>
        )}
      </CardHeader>

      {/* Body fields */}
      {bodyFields && bodyFields.length > 0 && (
        <CardContent className="pt-0 pb-4">
          <div className="space-y-3">
            {bodyFields.map((field, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-sm font-medium">
                  <FieldRenderer data={data} field={field} />
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Footer with actions */}
      {footerFields && footerFields.length > 0 && (
        <CardFooter className="bg-muted/30 py-3">
          <div className="flex items-center justify-between w-full">
            {footerFields.map((field, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-sm font-semibold">
                  <FieldRenderer data={data} field={field} />
                </span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// ============ MAIN CARD ITEM COMPONENT ============

export function CardItem<TData extends { _id: string }>(
  props: CardItemProps<TData>
) {
  const {
    renderCard,
    variant = "default",
    data,
    onEdit,
    onView,
    onDelete,
    customActions,
  } = props;

  // Custom render takes precedence.
  //
  // `customActions` ARE forwarded, bound to this row. A custom card still owns
  // its own layout — where an extra action belongs is its decision — but it is
  // now given the choice. Withholding them silently cost two pages a real
  // control: the users card had an Active/Inactive badge and no way to change
  // it (QA-R20), and the products card lost Print Label (QA-T1-E). A card that
  // ignores this array is exactly as it was; one that renders it stops needing
  // a hand-injected handler.
  if (renderCard) {
    const bound = (customActions ?? [])
      .filter((a) => a.placement === "menu" || a.placement === "cell")
      .map((a) => ({
        type: a.type,
        label: a.label,
        tooltip: a.tooltip,
        icon: a.icon,
        href: typeof a.href === "function" ? a.href(data) : a.href,
        disabled:
          typeof a.disabled === "function" ? a.disabled(data) : a.disabled,
        onClick: a.onClick ? () => a.onClick?.(data) : undefined,
      }));
    return (
      <>
        {renderCard(data, {
          onEdit,
          onView,
          onDelete,
          customActions: bound,
        })}
      </>
    );
  }

  // Variant-based rendering
  switch (variant) {
    case "compact":
      return <CompactCard {...props} />;
    case "detailed":
      return <DetailedCard {...props} />;
    default:
      return <DefaultCard {...props} />;
  }
}

// ============ EMPTY STATE ============

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function CardEmptyState({ message, icon, children }: EmptyStateProps) {
  if (children) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <p className="text-muted-foreground text-lg">
        {message || "No data available"}
      </p>
    </div>
  );
}

// ============ LOADING SKELETON ============

interface CardSkeletonProps {
  variant?: "default" | "compact" | "detailed";
  count?: number;
}

export function CardSkeleton({ variant = "default", count = 6 }: CardSkeletonProps) {
  const skeletons = Array.from({ length: count });

  if (variant === "compact") {
    return (
      <>
        {skeletons.map((_, idx) => (
          <Card key={idx} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (variant === "detailed") {
    return (
      <>
        {skeletons.map((_, idx) => (
          <Card key={idx} className="overflow-hidden animate-pulse">
            <div className="h-32 bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="space-y-2 mt-4">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-4/5 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </>
    );
  }

  // Default variant
  return (
    <>
      {skeletons.map((_, idx) => (
        <Card key={idx} className="animate-pulse p-0">
          <div className="aspect-video bg-muted rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
