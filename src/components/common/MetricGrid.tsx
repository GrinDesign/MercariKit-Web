import React from 'react';

interface Metric {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  subLabel?: string;
}

interface MetricGridProps {
  metrics: Metric[];
  columns?: number;
  className?: string;
}

const MetricGrid: React.FC<MetricGridProps> = ({
  metrics,
  columns = 3,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || 'grid-cols-3'} gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          {metric.icon && (
            <div className="flex justify-center mb-1">
              {metric.icon}
            </div>
          )}
          <div className="text-xs text-gray-500">{metric.label}</div>
          <div className={`text-lg font-semibold ${metric.color || 'text-gray-900'}`}>
            {metric.value}
          </div>
          {metric.subLabel && (
            <div className="text-xs text-gray-500 mt-1">{metric.subLabel}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MetricGrid;