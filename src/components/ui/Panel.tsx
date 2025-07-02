import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const panelVariants = cva(
  "flex flex-col rounded-lg border bg-secondary transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-primary",
        elevated: "border-primary shadow-lg",
        flat: "border-none shadow-none"
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-6"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default"
    }
  }
);

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, padding, title, description, headerActions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(panelVariants({ variant, padding, className }))}
      {...props}
    >
      {(title || description || headerActions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-primary mb-1">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-secondary">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 ml-4">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
);

Panel.displayName = "Panel";

export { Panel, panelVariants };
