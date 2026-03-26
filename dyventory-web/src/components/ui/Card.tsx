import { cn } from "@/lib/utils";

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
} as const;

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: keyof typeof paddings;
}

export function Card({ className, children, padding = "md" }: CardProps) {
  return (
    <div className={cn("card", paddings[padding], className)}>{children}</div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn("text-base font-semibold text-(--text-primary)", className)}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mt-4 pt-4 border-t border-(--border-default)", className)}
    >
      {children}
    </div>
  );
}
