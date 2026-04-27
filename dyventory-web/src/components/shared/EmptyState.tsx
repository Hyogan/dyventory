import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="size-16 rounded-2xl bg-surface-muted border border-border flex items-center justify-center shadow-sm">
        <div className="text-fg-muted">
          {icon ?? <PackageOpen className="size-8 opacity-50" />}
        </div>
      </div>
      {title && (
        <h3 className="font-semibold text-fg">{title}</h3>
      )}
      <p className="text-sm text-fg-muted max-w-xs">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
