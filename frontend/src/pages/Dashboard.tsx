import React, { useEffect, useState } from 'react';
import { MetricsCard } from '../components/MetricsCard';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/company');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Error loading data.</div>;

    const data = {
        labels: ['Promoters', 'Passives', 'Detractors'],
        datasets: [
            {
                label: '# of Votes',
                data: [stats.enps.promoters, stats.enps.passives, stats.enps.detractors],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                ],
            },
        ],
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
                    <p className="text-gray-500 mt-2">Overview of employee engagement metrics</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricsCard
                        title="eNPS Score"
                        value={stats.enps.score}
                        description="Net Promoter Score"
                        change={stats.enps.score > 0 ? 5 : -2} // Mock change for demo
                    />
                    <MetricsCard
                        title="Favorability"
                        value={`${stats.favorability}%`}
                        description="Positive responses (4-5)"
                    />
                    <MetricsCard
                        title="Total Surveys"
                        value={stats.total_surveys}
                        description="Responses collected"
                    />
                    <MetricsCard
                        title="Participation"
                        value="85%"
                        description="Estimated rate"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">eNPS Breakdown</h3>
                        <Bar data={data} />
                    </div>
                </div>
            </div>
        </div>
    );
};
