"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface ResponsiveModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra header content under the title, such as badges and actions. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** "dialog" is centered on desktop, "side" slides in from the right. Both are bottom sheets on phones. */
  variant?: "dialog" | "side";
  /** Desktop width of a "dialog". */
  size?: "md" | "lg";
  bodyClassName?: string;
  children: React.ReactNode;
}

// Header and footer stay put; only the body scrolls, so actions are always in reach.
export function ResponsiveModal({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  header,
  footer,
  variant = "dialog",
  size = "md",
  bodyClassName,
  children,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();
  // Parents unmount this on close, so wait for the slide-out to finish before telling them.
  const [closing, setClosing] = React.useState(false);

  // Reset closing state whenever the controlled open prop changes
  React.useEffect(() => {
    setClosing(false);
  }, [open]);

  const root = {
    open: open && !closing,
    onOpenChange: (next: boolean) => {
      if (!next) {
        setClosing(true);
      } else {
        setClosing(false);
      }
    },
    onOpenChangeComplete: (next: boolean) => {
      if (!next) {
        setClosing(false);
        onClose?.();
        onOpenChange?.(false);
      } else {
        onOpenChange?.(true);
      }
    },
  };

  const layout = (Title: typeof DialogTitle, Description: typeof DialogDescription) => (
    <>
      <header className="shrink-0 space-y-2 border-b px-4 pt-3 pb-3 md:px-6 md:pt-5 md:pb-4">
        <div className="min-w-0 space-y-0.5 pr-10">
          <Title className="text-base leading-snug font-semibold break-words md:text-lg">{title}</Title>
          {description && <Description className="text-sm break-words text-muted-foreground">{description}</Description>}
        </div>
        {header}
      </header>
      {/* The body handles its own vertical drags, so scrolling never dismisses the sheet. */}
      <div data-base-ui-swipe-ignore="y" className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6", bodyClassName)}>
        {children}
      </div>
      {footer && (
        <footer className="shrink-0 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-4">
          {footer}
        </footer>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer {...root}>
        <DrawerContent>{layout(DrawerTitle as typeof DialogTitle, DrawerDescription as typeof DialogDescription)}</DrawerContent>
      </Drawer>
    );
  }

  if (variant === "side") {
    return (
      <Sheet {...root}>
        <SheetContent
          side="right"
          className="gap-0 duration-300 data-open:animate-in data-open:slide-in-from-right data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        >
          {layout(SheetTitle as typeof DialogTitle, SheetDescription as typeof DialogDescription)}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog {...root}>
      <DialogContent className={cn("max-h-[90vh] gap-0 p-0", size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md")}>
        {layout(DialogTitle, DialogDescription)}
      </DialogContent>
    </Dialog>
  );
}
