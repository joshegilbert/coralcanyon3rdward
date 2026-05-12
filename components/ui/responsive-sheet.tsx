"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-is-mobile";
import { SheetContent } from "@/components/ui/sheet";

type ResponsiveSheetContentProps = SheetPrimitive.Popup.Props & {
  /** Side on lg+ viewports. Defaults to "right". */
  desktopSide?: "right" | "left";
  /** Side on mobile (below lg). Defaults to "bottom". */
  mobileSide?: "bottom" | "top";
  showCloseButton?: boolean;
};

/**
 * A `<SheetContent>` that auto-switches between a bottom sheet on mobile and
 * a right-side drawer on desktop. Adds safe-area-bottom padding when shown
 * from the bottom so content doesn't sit under the iPhone home indicator.
 */
export function ResponsiveSheetContent({
  className,
  desktopSide = "right",
  mobileSide = "bottom",
  ...props
}: ResponsiveSheetContentProps) {
  const isMobile = useIsMobile();
  const side = isMobile ? mobileSide : desktopSide;
  const isBottom = side === "bottom";

  return (
    <SheetContent
      side={side}
      className={cn(
        isBottom
          ? "max-h-[92svh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          : "w-full overflow-y-auto sm:max-w-md",
        className,
      )}
      {...props}
    />
  );
}
