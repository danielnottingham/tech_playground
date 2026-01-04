import type { FC, ReactNode } from 'react';

interface MetricsCardProps {
    title: string;
    value: string | number;
    description?: string;
    change?: number;
    icon?: ReactNode;
}

export const MetricsCard: FC<MetricsCardProps> = ({ title, value, description, change }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
                </div>
                {change !== undefined && (
                    <div className={`text-sm font-medium px-2 py-1 rounded ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {change > 0 ? '+' : ''}{change}%
                    </div>
                )}
            </div>
        </div>
    );
};
