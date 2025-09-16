import React from 'react';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface StatusFilterProps {
  filters: FilterOption[];
  activeFilter: string;
  onChange: (filter: string) => void;
  className?: string;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  filters,
  activeFilter,
  onChange,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      <div className="flex overflow-x-auto border-b border-gray-200">
        {filters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors ${
              activeFilter === filter.value
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              {filter.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatusFilter;