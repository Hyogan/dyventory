import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6 gap-4', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-(--text-muted) mb-1 flex-wrap">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 shrink-0" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-(--text-primary) transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-(--text-primary)">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary) truncate">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-(--text-muted) mt-0.5">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}