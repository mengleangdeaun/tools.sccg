import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// xs initials sit in a 20px circle, so they stay below the 12px text floor.
const SIZES = { xs: "size-5 text-[9px]", sm: "size-7 text-xs", md: "size-8 text-xs", lg: "size-14 text-lg" } as const;

interface PersonAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** The person's Google photo, or their initials when there is none or it fails to load. */
export function PersonAvatar({ name, avatarUrl, size = "sm", className }: PersonAvatarProps) {
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {/* Google's photo host refuses some requests that carry a referrer. */}
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="text-inherit">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
