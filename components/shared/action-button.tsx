"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  /** Opens in a new tab instead of running onClick. */
  href?: string;
  /** Show the label as text. Use on touch layouts, where tooltips never appear. */
  showLabel?: boolean;
  variant?: "ghost" | "outline";
}

export function ActionButton({ icon, label, onClick, href, showLabel, variant = "ghost" }: ActionButtonProps) {
  const className = cn(
    buttonVariants({ variant, size: showLabel ? "sm" : "icon-sm" }),
    showLabel ? "h-10 gap-1.5 md:h-8" : "text-muted-foreground hover:text-foreground"
  );
  const content = showLabel ? (
    <>
      {icon}
      {label}
    </>
  ) : (
    icon
  );
  const control = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={showLabel ? undefined : label} className={className}>
      {content}
    </a>
  ) : (
    <Button type="button" variant={variant} onClick={onClick} aria-label={showLabel ? undefined : label} className={className}>
      {content}
    </Button>
  );

  if (showLabel) return control;
  return (
    <Tooltip>
      <TooltipTrigger render={control} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
