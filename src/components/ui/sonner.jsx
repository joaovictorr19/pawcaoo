import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    (<Sonner
      theme="light"
      className="toaster group"
      style={{ "--z-index": 10010 }}
      toastOptions={{
        style: {
          top: "70px",
        },
        classNames: {
          toast:
            "group toast !z-[10010] group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />)
  );
}

export { Toaster }