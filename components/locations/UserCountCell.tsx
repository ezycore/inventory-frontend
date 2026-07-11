"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Users } from "lucide-react";

interface UserCountCellProps {
  users: { _id: string; name: string; email: string; role?: string }[];
}

function formatRoleName(role: string) {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function UserCountCell({ users }: UserCountCellProps) {
  const t = useTranslations("settings.locations.usersPopover");
  const userCount = users?.length;

  if (!userCount) {
    return <span className="text-muted-foreground">0</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Users className="h-4 w-4 mr-1" />
          <span className="font-medium">{userCount}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{t("usersTitle")}</h4>
            <Badge variant="secondary">{t("total", { count: userCount })}</Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-start justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {`${user.name}`.trim() || user.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>

                {user.role && <Badge
                  variant={
                    user.role === "admin"
                      ? "default"
                      : user.role === "super_admin" || user.role === "manager"
                        ? "secondary"
                        : "outline"
                  }
                  className="ml-2 shrink-0"
                >
                  {formatRoleName(user.role)}
                </Badge>}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
