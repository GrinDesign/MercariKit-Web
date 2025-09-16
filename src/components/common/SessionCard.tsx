import React from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface SessionCardProps {
  title: string;
  status: 'active' | 'completed';
  date?: string;
  statusBadge?: React.ReactNode;
  metricsArea: React.ReactNode;
  expandable?: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
  expandedContent?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  title,
  status,
  date,
  statusBadge,
  metricsArea,
  expandable = false,
  isExpanded = false,
  onExpand,
  expandedContent,
  actions,
  className = ''
}) => {
  const getDefaultStatusBadge = () => {
    return status === 'active'
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">進行中</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">完了</span>;
  };

  return (
    <div className={`p-6 hover:bg-gray-50 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* ヘッダー部分 */}
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="text-gray-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {statusBadge || getDefaultStatusBadge()}
            {date && (
              <span className="text-sm text-gray-600">
                {date}
              </span>
            )}
          </div>

          {/* メトリクスエリア（個別化される部分） */}
          {metricsArea}
        </div>

        {/* アクションエリア */}
        <div className="flex items-center ml-4 space-x-2">
          {actions}

          {expandable && (
            <button
              onClick={onExpand}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>詳細</span>
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* 展開コンテンツ */}
      {expandable && isExpanded && expandedContent && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {expandedContent}
        </div>
      )}
    </div>
  );
};

export default SessionCard;