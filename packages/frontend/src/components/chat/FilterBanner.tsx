interface FilterBannerProps {
  showing: number;
  total: number;
  label: string;
  onShowAll: () => void;
}

export function FilterBanner({ showing, total, label, onShowAll }: FilterBannerProps) {
  return (
    <div className="flex items-center justify-between mx-4 mb-2 px-3 py-1.5 bg-purple/10 rounded-full text-sm">
      <span className="text-gray-600">
        Showing <span className="font-medium text-ink">{showing}</span> of{" "}
        <span className="font-medium text-ink">{total}</span> {label}
      </span>
      <button
        onClick={onShowAll}
        className="text-purple hover:text-purple-hover font-medium transition-colors duration-150"
      >
        Show all
      </button>
    </div>
  );
}
