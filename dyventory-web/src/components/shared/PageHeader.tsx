import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-muted mb-1 flex-wrap">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-fg transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-fg">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-fg-muted mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
