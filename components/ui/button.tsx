import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans",
  {
    variants: {
      variant: {
        default: "bg-[var(--surm-accent)] text-white hover:bg-[#35803F] shadow-sm focus-visible:ring-[var(--surm-accent)]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border border-red-700 focus-visible:ring-red-600 focus-visible:border-red-700",
        outline:
          "btn-outline-variant border-2 border-[var(--surm-green)] bg-white text-[var(--surm-text-dark)] hover:bg-[var(--surm-paper)] hover:border-[var(--surm-accent)] hover:text-[var(--surm-accent)] font-semibold shadow-sm",
        secondary:
          "border-2 border-[var(--surm-green)]/60 bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)] hover:border-[var(--surm-green)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "bg-[var(--surm-accent)] text-white hover:bg-[#35803F] shadow-sm px-5 py-2 h-10 rounded-full",
        "pill-white": "bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)] px-5 py-2 h-10 rounded-full border border-[var(--surm-green)]/10",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

