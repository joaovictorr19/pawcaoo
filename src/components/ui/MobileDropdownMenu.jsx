import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export function MobileDropdownMenu({ trigger, children, ...props }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) {
    return (
      <DropdownMenu {...props}>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile: render as drawer
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent>
        <div className="p-4 space-y-2">
          {React.Children.map(children, (child) => {
            if (!child) return null;
            return (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  child.props?.onClick?.();
                  setIsOpen(false);
                }}
              >
                {child.props.children}
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";