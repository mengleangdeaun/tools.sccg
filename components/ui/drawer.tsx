"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

// A bottom sheet for phones. Swipe down, tap outside, or use the X to close.
function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.VirtualKeyboardProvider>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop
          data-slot="drawer-overlay"
          className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-[var(--ease-out)] data-ending-style:opacity-0 data-open:animate-in data-open:fade-in-0 data-starting-style:opacity-0"
        />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <DrawerPrimitive.Popup
            data-slot="drawer-content"
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-popover text-sm text-popover-foreground shadow-2xl outline-none transition-transform duration-300 ease-[var(--ease-drawer)] [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-ending-style:[transform:translateY(100%)] data-open:animate-in data-open:slide-in-from-bottom data-starting-style:[transform:translateY(100%)] data-swiping:transition-none",
              className
            )}
            {...props}
          >
            <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
              {children}
            </DrawerPrimitive.Content>
            <DrawerPrimitive.Close
              data-slot="drawer-close"
              render={<Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5" />}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DrawerPrimitive.Close>
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.VirtualKeyboardProvider>
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Drawer, DrawerContent, DrawerTitle, DrawerDescription }
