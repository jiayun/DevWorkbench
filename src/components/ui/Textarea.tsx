import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-tertiary text-sm text-primary placeholder-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default: "border-primary",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500",
        success: "border-green-500 focus:border-green-500 focus:ring-green-500"
      },
      size: {
        sm: "min-h-[60px] p-2 text-xs",
        default: "min-h-[80px] p-3",
        lg: "min-h-[120px] p-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  label?: string;
  helperText?: string;
  resizable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, label, helperText, resizable = false, style, ...props }, ref) => {
    const textareaVariant = error ? 'error' : variant;

    // Inline padding to ensure it works with Tailwind v4
    const paddingMap = {
      sm: '8px',
      default: '12px',
      lg: '16px'
    };
    const padding = paddingMap[size || 'default'];

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary mb-2">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            textareaVariants({ variant: textareaVariant, size }),
            resizable && "resize-y",
            className
          )}
          style={{ padding, ...style }}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn(
            "mt-1 text-xs",
            error ? "text-red-500" : "text-secondary"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
