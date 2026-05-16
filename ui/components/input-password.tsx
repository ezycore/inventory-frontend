"use client";
import * as React from "react";

import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

function Password({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={showCurrentPassword ? "text" : "password"}
        placeholder="Enter your password"
        {...props}  
      />
      <button
        type="button"
        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {showCurrentPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export { Password };
