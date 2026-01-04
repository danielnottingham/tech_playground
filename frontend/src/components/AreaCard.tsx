import type { FC } from 'react';
import { Link } from 'react-router-dom';

interface AreaCardProps {
    area: {
        id: number;
        n4Area: string;
        n2Gerencia: string;
    };
    stats: {
        enps: { score: number };
        favorability: number;
        total_surveys: number;
    };
}

export const AreaCard: FC<AreaCardProps> = ({ area, stats }) => {
    const isEnpsPositive = stats.enps.score >= 0;

    return (
        <Link to={`/areas/${area.id}`} className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{area.n4Area}</h3>
                <p className="text-sm text-gray-500 mb-4">{area.n2Gerencia}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase">eNPS</p>
                        <p className={`text-xl font-bold ${isEnpsPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.enps.score}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Favorability</p>
                        <p className="text-xl font-bold text-indigo-600">{stats.favorability}%</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">{stats.total_surveys} responses</span>
                    <span className="text-xs text-indigo-600 font-medium">View Details →</span>
                </div>
            </div>
        </Link>
    );
};
