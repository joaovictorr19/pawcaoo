import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export function MobileSelect({ value, onValueChange, children, placeholder, ...props }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} {...props}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: render as drawer with buttons
  const selectedChild = React.Children.toArray(children).find(
    child => child.props.value === value
  );
  const selectedLabel = selectedChild?.props.children || placeholder;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedLabel}
          <span className="text-gray-400">↓</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="p-4 space-y-2">
          {React.Children.map(children, (child) => (
            <Button
              variant={value === child.props.value ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                onValueChange(child.props.value);
                setIsOpen(false);
              }}
            >
              {child.props.children}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { SelectItem, SelectValue };