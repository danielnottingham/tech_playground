import { useEffect, useState, type FC } from 'react';
import { MetricsCard } from '../components/MetricsCard';
import { ScoreDistribution } from '../components/ScoreDistribution';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface CompanyStats {
    total_surveys: number;
    enps: {
        score: number;
        promoters: number;
        passives: number;
        detractors: number;
        total: number;
    };
    favorability: number;
    averages: Record<string, number>;
}

const getEnpsColor = (score: number): string => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
};

const getEnpsLabel = (score: number): string => {
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Moderate';
    return 'Needs Improvement';
};

export const Dashboard: FC = () => {
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/company');
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError('Failed to load dashboard data. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-500 text-lg">{error || 'Error loading data.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const enpsDonutData = {
        labels: ['Promoters (9-10)', 'Passives (7-8)', 'Detractors (0-6)'],
        datasets: [
            {
                data: [stats.enps.promoters, stats.enps.passives, stats.enps.detractors],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(250, 204, 21, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(250, 204, 21)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const enpsDonutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const total = stats.enps.total;
                        const value = context.raw;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
    };

    const enpsBarData = {
        labels: ['Promoters', 'Passives', 'Detractors'],
        datasets: [
            {
                label: 'Count',
                data: [stats.enps.promoters, stats.enps.passives, stats.enps.detractors],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.6)',
                    'rgba(250, 204, 21, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(250, 204, 21)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const enpsBarOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Responses'
                }
            }
        }
    };

    const favorabilityData = {
        labels: ['Favorable (4-5)', 'Unfavorable (1-3)'],
        datasets: [
            {
                data: [stats.favorability, 100 - stats.favorability],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(209, 213, 219, 0.8)',
                ],
                borderColor: [
                    'rgb(99, 102, 241)',
                    'rgb(209, 213, 219)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const favorabilityOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
        cutout: '70%',
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
                    <p className="text-gray-500 mt-2">Overview of employee engagement metrics across the organization</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricsCard
                        title="eNPS Score"
                        value={stats.enps.score.toFixed(0)}
                        description={getEnpsLabel(stats.enps.score)}
                    />
                    <MetricsCard
                        title="Favorability"
                        value={`${stats.favorability.toFixed(1)}%`}
                        description="Positive responses (4+)"
                    />
                    <MetricsCard
                        title="Total Surveys"
                        value={stats.total_surveys}
                        description="Responses collected"
                    />
                    <MetricsCard
                        title="Response Rate"
                        value={`${stats.enps.total}`}
                        description="Valid eNPS responses"
                    />
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Employee Net Promoter Score (eNPS)</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500 mb-2">Current eNPS</p>
                                <div className={`text-6xl font-bold ${getEnpsColor(stats.enps.score)}`}>
                                    {stats.enps.score.toFixed(0)}
                                </div>
                                <p className={`text-sm mt-2 ${getEnpsColor(stats.enps.score)}`}>
                                    {getEnpsLabel(stats.enps.score)}
                                </p>
                                <div className="mt-4 text-xs text-gray-400">
                                    Scale: -100 to +100
                                </div>

                                <div className="mt-4 relative h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
                                    <div
                                        className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow"
                                        style={{ left: `${((stats.enps.score + 100) / 200) * 100}%`, marginLeft: '-8px' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>-100</span>
                                    <span>0</span>
                                    <span>+100</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Response Distribution</h3>
                            <div className="h-64">
                                <Doughnut data={enpsDonutData} options={enpsDonutOptions} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">eNPS Breakdown</h3>
                            <Bar data={enpsBarData} options={enpsBarOptions} />
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="bg-green-50 p-2 rounded">
                                    <div className="font-bold text-green-600">{stats.enps.promoters}</div>
                                    <div className="text-green-700 text-xs">Promoters</div>
                                </div>
                                <div className="bg-yellow-50 p-2 rounded">
                                    <div className="font-bold text-yellow-600">{stats.enps.passives}</div>
                                    <div className="text-yellow-700 text-xs">Passives</div>
                                </div>
                                <div className="bg-red-50 p-2 rounded">
                                    <div className="font-bold text-red-600">{stats.enps.detractors}</div>
                                    <div className="text-red-700 text-xs">Detractors</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Survey Scores & Favorability</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Overall Favorability</h3>
                            <div className="h-64 relative">
                                <Doughnut data={favorabilityData} options={favorabilityOptions} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-indigo-600">{stats.favorability.toFixed(1)}%</div>
                                        <div className="text-xs text-gray-500">Favorable</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Percentage of responses rated 4 or higher on the scale
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Scores by Category</h3>
                            <ScoreDistribution averages={stats.averages} />
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Average scores across all survey categories (1-7 scale)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Category Scores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Average Score</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Performance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(stats.averages).map(([key, value]) => {
                                    const label = key
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, str => str.toUpperCase());
                                    const percentage = (value / 7) * 100;
                                    const barColor = value >= 5 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';

                                    return (
                                        <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900">{label}</td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-900">{value.toFixed(2)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${barColor} transition-all duration-300`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-12">{percentage.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Data based on {stats.total_surveys} survey responses</p>
                </footer>
            </div>
        </div>
    );
};
