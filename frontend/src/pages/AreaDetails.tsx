import { useEffect, useState, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MetricsCard } from '../components/MetricsCard';
import { ScoreDistribution } from '../components/ScoreDistribution';
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

export const AreaDetails: FC = () => {
    const { id } = useParams<{ id: string }>();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAreaStats = async () => {
            try {
                const response = await api.get(`/stats/areas/${id}`);
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching area stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAreaStats();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading area data...</div>;
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
                <Link to="/areas" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">← Back to Areas</Link>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Area Details</h1>
                    <p className="text-gray-500 mt-2">Detailed metrics for this area</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <MetricsCard
                        title="eNPS Score"
                        value={stats.enps.score}
                        description="Net Promoter Score"
                        change={stats.enps.score > 0 ? 5 : -2}
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">eNPS Breakdown</h3>
                        <Bar data={data} />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <ScoreDistribution averages={stats.averages} />
                    </div>
                </div>
            </div>
        </div>
    );
};
