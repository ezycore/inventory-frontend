"use client";
// coding-standard: maintained

import type { User } from "@/types/users";
import type { Translator } from "@/i18n/config";
import { Card } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  AlertCircle,
  Calendar,
  Edit2,
  Mail,
  MailCheck,
  MapPin,
  MoreVertical,
  Phone,
  Shield,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn as bnDateLocale } from "date-fns/locale";
import { fullName, initials } from "@/utils/user-name";

const roleConfig: Record<string, { color: string; icon: string }> = {
  admin: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    icon: "🛡️",
  },
  manager: {
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    icon: "👔",
  },
  staff: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: "👤",
  },
  viewer: {
    color: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700",
    icon: "👁️",
  },
};

function formatRoleName(role: string) {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const avatarGradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-emerald-600",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

/**
 * User card view – used as `renderCard` inside DataCard.
 * Signature: (item, { onEdit, onView, onDelete }) => ReactNode
 */
const UserCardView = (
  item: User,
  { onEdit, onDelete }: { onEdit?: () => void; onView?: () => void; onDelete?: () => void },
  options: {
    roleLabel?: string;
    hasAllLocationAccess?: boolean;
    t: Translator;
    locale?: "en" | "bn";
  },
) => {
  const { t, locale } = options;
  const name = fullName(item);
  const userInitials = initials(item);
  const gradient = getAvatarGradient(name);
  const isActive = item.status === "active";
  const role = roleConfig[item.role] || roleConfig.viewer;
  const hasAllLocationAccess =
    options.hasAllLocationAccess ||
    item.role === "admin" ||
    item.role === "super_admin";
  const locationCount = hasAllLocationAccess ? "All" : (item.locations?.length || 0);
  const roleLabel = options.roleLabel || formatRoleName(item.role);

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      {/* Status indicator strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${isActive ? "bg-emerald-500" : "bg-red-400"}`}
      />

      <div className="p-5">
        {/* Header: Avatar + Identity + Actions */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative shrink-0">
            <div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
            >
              {userInitials}
            </div>
            {/* Online status dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${isActive ? "bg-emerald-500" : "bg-gray-400"}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" />
              {item.email}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                {t("card.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t("card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${role.color}`}
          >
            <Shield className="h-3 w-3" />
            {roleLabel}
          </span>
          <Badge
            variant={isActive ? "default" : "destructive"}
            className="text-xs font-medium"
          >
            {isActive ? t("card.active") : t("card.inactive")}
          </Badge>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
              item.emailVerified
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            }`}
          >
            {item.emailVerified ? (
              <MailCheck className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {item.emailVerified ? t("card.verified") : t("card.unverified")}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-2 text-xs">
          {item.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{item.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {typeof locationCount === "string"
                ? t("card.allLocations")
                : t("card.locationsCount", { count: locationCount })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>
            {t("card.joined", {
              time: formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
                locale: locale === "bn" ? bnDateLocale : undefined,
              }),
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default UserCardView;
