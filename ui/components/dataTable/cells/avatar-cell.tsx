import React from "react";
import { LucideIcon, Star } from "lucide-react";
import { SafeImage } from "@/ui/components/safeImage";

export interface AvatarCellProps {
  imageUrl?: string | null;
  name: string;
  fallbackIcon?: LucideIcon;
  isActive?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

export function AvatarCell({
  imageUrl,
  name,
  fallbackIcon: FallbackIcon = Star,
  isActive,
  activeColor = "text-green-600",
  inactiveColor = "text-red-600",
}: AvatarCellProps) {
  const textColorClass = typeof isActive === "boolean" 
    ? (isActive ? activeColor : inactiveColor)
    : "";

  return (
    <div className="flex items-center gap-3">
      {imageUrl ? (
        <div className="relative w-8 h-8 rounded overflow-hidden">
          <SafeImage
            src={imageUrl}
            alt={name}
            fill={true}
            className="object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
          <FallbackIcon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <span className={`font-medium capitalize ${textColorClass}`.trim()}>
        {name}
      </span>
    </div>
  );
}
