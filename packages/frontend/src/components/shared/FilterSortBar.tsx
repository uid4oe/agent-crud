import { ArrowUpDown, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: readonly FilterOption[];
}

export interface SortOption {
  value: string;
  label: string;
}

interface FilterSortBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string | undefined>;
  onFilterChange: (key: string, value: string | undefined) => void;
  sortOptions?: readonly SortOption[];
  activeSort?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function FilterSortBar({
  filters,
  activeFilters,
  onFilterChange,
  sortOptions,
  activeSort,
  sortOrder = "desc",
  onSortChange,
}: FilterSortBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={activeFilters[filter.key] ?? ""}
          onChange={(e) =>
            onFilterChange(filter.key, e.target.value || undefined)
          }
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-all duration-150 appearance-none cursor-pointer pr-7 bg-no-repeat bg-[length:12px] bg-[right_8px_center]",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]",
            activeFilters[filter.key]
              ? "border-purple bg-purple-light text-purple-foreground"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          )}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {sortOptions && onSortChange && (
        <select
          value={activeSort ?? ""}
          onChange={(e) => {
            if (e.target.value) {
              onSortChange(e.target.value, sortOrder);
            }
          }}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all duration-150 appearance-none cursor-pointer pr-7 bg-no-repeat bg-[length:12px] bg-[right_8px_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]"
        >
          <option value="">Sort by...</option>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {sortOptions && onSortChange && activeSort && (
        <button
          onClick={() => onSortChange(activeSort, sortOrder === "asc" ? "desc" : "asc")}
          className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all duration-150"
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
        >
          <ArrowUpDown className={cn("h-3 w-3", sortOrder === "asc" && "rotate-180")} />
        </button>
      )}

      {hasActiveFilters && (
        <button
          onClick={() => {
            for (const filter of filters) {
              onFilterChange(filter.key, undefined);
            }
          }}
          className="text-xs px-2 py-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
