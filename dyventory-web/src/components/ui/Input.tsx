import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input on the right side */
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, className, id, required, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {required && (
              <span className="text-danger-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              "input",
              error && "input-error",
              suffix && "pr-10",
              className,
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-fg-muted text-sm">
              {suffix}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-fg-muted">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-danger-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
