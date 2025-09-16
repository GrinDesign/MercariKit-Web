import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  color = 'blue',
  height = 'md',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;