import {
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Circle,
  AlignLeft,
} from "lucide-react";
import type { FieldType } from "@/types/field-schema";
import { cn } from "@/lib/utils";

interface FieldTypeIconProps {
  type: FieldType;
  className?: string;
}

const iconMap: Record<FieldType, React.ElementType> = {
  text:     Type,
  number:   Hash,
  date:     Calendar,
  select:   List,
  checkbox: CheckSquare,
  radio:    Circle,
  textarea: AlignLeft,
};

const colorMap: Record<FieldType, string> = {
  text:     "text-blue-500",
  number:   "text-orange-500",
  date:     "text-purple-500",
  select:   "text-teal-500",
  checkbox: "text-green-500",
  radio:    "text-pink-500",
  textarea: "text-slate-500",
};

export function FieldTypeIcon({ type, className }: FieldTypeIconProps) {
  const Icon = iconMap[type] ?? Type;
  return <Icon className={cn("size-4", colorMap[type], className)} />;
}
