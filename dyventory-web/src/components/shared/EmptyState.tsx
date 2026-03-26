import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-(--text-muted)">
        {icon ?? <PackageOpen className="size-12 opacity-40" />}
      </div>
      {title && (
        <h3 className="font-semibold text-(--text-primary)">{title}</h3>
      )}
      <p className="text-sm text-(--text-muted) max-w-xs">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
