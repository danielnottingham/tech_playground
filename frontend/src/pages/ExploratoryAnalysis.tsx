import { useEffect, useState, type FC } from 'react';
import { MetricsCard } from '../components/MetricsCard';
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

interface SummaryStats {
    overview: {
        totalEmployees: number;
        totalSurveys: number;
        totalAreas: number;
        responseRate: number;
    };
    enpsStats: {
        mean: number;
        median: number;
        min: number;
        max: number;
        stdDev: number;
        count: number;
    };
    likertStats: Record<string, {
        label: string;
        mean: number;
        median: number;
        min: number;
        max: number;
        stdDev: number;
        count: number;
    }>;
    demographics: {
        byGender: Record<string, number>;
        byGeneration: Record<string, number>;
        byTenure: Record<string, number>;
    };
}

interface ResponseDistribution {
    total: number;
    likert: {
        field: string;
        label: string;
        distribution: Record<number, number>;
    }[];
    enps: Record<number, number>;
}

interface CorrelationData {
    fields: { key: string; label: string }[];
    matrix: Record<string, Record<string, number>>;
}

interface DemographicDistribution {
    dimension: string;
    total: number;
    distribution: {
        group: string;
        count: number;
        enps: { score: number };
        favorability: number;
    }[];
}

export const ExploratoryAnalysis: FC = () => {
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [responseDistribution, setResponseDistribution] = useState<ResponseDistribution | null>(null);
    const [correlations, setCorrelations] = useState<CorrelationData | null>(null);
    const [demographicData, setDemographicData] = useState<DemographicDistribution | null>(null);
    const [selectedDimension, setSelectedDimension] = useState<'genero' | 'geracao' | 'tempoDeEmpresa'>('genero');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, responseRes, correlationsRes] = await Promise.all([
                    api.get('/stats/eda/summary'),
                    api.get('/stats/eda/responses'),
                    api.get('/stats/eda/correlations'),
                ]);

                setSummary(summaryRes.data);
                setResponseDistribution(responseRes.data);
                setCorrelations(correlationsRes.data);
            } catch (err) {
                console.error('Error fetching EDA data:', err);
                setError('Failed to load exploratory data analysis. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchDemographic = async () => {
            try {
                const res = await api.get(`/stats/eda/distribution/${selectedDimension}`);
                setDemographicData(res.data);
            } catch (err) {
                console.error('Error fetching demographic data:', err);
            }
        };

        fetchDemographic();
    }, [selectedDimension]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading exploratory analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !summary) {
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

    const enpsHistogramData = responseDistribution ? {
        labels: Object.keys(responseDistribution.enps).map(k => k),
        datasets: [{
            label: 'Responses',
            data: Object.values(responseDistribution.enps),
            backgroundColor: Object.keys(responseDistribution.enps).map(k => {
                const score = parseInt(k);
                if (score >= 9) return 'rgba(34, 197, 94, 0.7)';
                if (score >= 7) return 'rgba(250, 204, 21, 0.7)';
                return 'rgba(239, 68, 68, 0.7)';
            }),
            borderColor: Object.keys(responseDistribution.enps).map(k => {
                const score = parseInt(k);
                if (score >= 9) return 'rgb(34, 197, 94)';
                if (score >= 7) return 'rgb(250, 204, 21)';
                return 'rgb(239, 68, 68)';
            }),
            borderWidth: 1,
        }],
    } : null;

    const demographicChartData = demographicData ? {
        labels: demographicData.distribution.map(d => d.group),
        datasets: [{
            label: 'Count',
            data: demographicData.distribution.map(d => d.count),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
        }],
    } : null;

    const demographicEnpsData = demographicData ? {
        labels: demographicData.distribution.map(d => d.group),
        datasets: [{
            label: 'eNPS Score',
            data: demographicData.distribution.map(d => d.enps.score),
            backgroundColor: demographicData.distribution.map(d => {
                if (d.enps.score >= 50) return 'rgba(34, 197, 94, 0.7)';
                if (d.enps.score >= 0) return 'rgba(250, 204, 21, 0.7)';
                return 'rgba(239, 68, 68, 0.7)';
            }),
            borderWidth: 1,
        }],
    } : null;

    const genderPieData = summary ? {
        labels: Object.keys(summary.demographics.byGender),
        datasets: [{
            data: Object.values(summary.demographics.byGender),
            backgroundColor: [
                'rgba(99, 102, 241, 0.7)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(156, 163, 175, 0.7)',
            ],
            borderWidth: 1,
        }],
    } : null;

    const generationPieData = summary ? {
        labels: Object.keys(summary.demographics.byGeneration),
        datasets: [{
            data: Object.values(summary.demographics.byGeneration),
            backgroundColor: [
                'rgba(34, 197, 94, 0.7)',
                'rgba(59, 130, 246, 0.7)',
                'rgba(168, 85, 247, 0.7)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(156, 163, 175, 0.7)',
            ],
            borderWidth: 1,
        }],
    } : null;

    const getCorrelationColor = (value: number) => {
        if (value >= 0.7) return 'bg-green-600 text-white';
        if (value >= 0.4) return 'bg-green-400 text-white';
        if (value >= 0.2) return 'bg-green-200';
        if (value >= -0.2) return 'bg-gray-100';
        if (value >= -0.4) return 'bg-red-200';
        if (value >= -0.7) return 'bg-red-400 text-white';
        return 'bg-red-600 text-white';
    };

    const dimensionLabels = {
        genero: 'Gender',
        geracao: 'Generation',
        tempoDeEmpresa: 'Tenure',
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Exploratory Data Analysis</h1>
                    <p className="text-gray-500 mt-2">In-depth statistical analysis and data exploration</p>
                </header>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricsCard
                        title="Total Employees"
                        value={summary.overview.totalEmployees}
                        description="In the dataset"
                    />
                    <MetricsCard
                        title="Total Surveys"
                        value={summary.overview.totalSurveys}
                        description="Responses collected"
                    />
                    <MetricsCard
                        title="Total Areas"
                        value={summary.overview.totalAreas}
                        description="Organizational units"
                    />
                    <MetricsCard
                        title="Response Rate"
                        value={`${summary.overview.responseRate}%`}
                        description="Survey completion"
                    />
                </div>

                {/* eNPS Statistics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">eNPS Summary Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Mean</p>
                            <p className="text-2xl font-bold text-indigo-600">{summary.enpsStats.mean}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Median</p>
                            <p className="text-2xl font-bold text-indigo-600">{summary.enpsStats.median}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Min</p>
                            <p className="text-2xl font-bold text-red-600">{summary.enpsStats.min}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Max</p>
                            <p className="text-2xl font-bold text-green-600">{summary.enpsStats.max}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Std Dev</p>
                            <p className="text-2xl font-bold text-gray-600">{summary.enpsStats.stdDev}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Count</p>
                            <p className="text-2xl font-bold text-gray-600">{summary.enpsStats.count}</p>
                        </div>
                    </div>
                </div>

                {/* eNPS Distribution Histogram */}
                {enpsHistogramData && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">eNPS Response Distribution</h2>
                        <div className="h-64">
                            <Bar
                                data={enpsHistogramData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { title: { display: true, text: 'eNPS Score (0-10)' } },
                                        y: { beginAtZero: true, title: { display: true, text: 'Number of Responses' } },
                                    },
                                }}
                            />
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-sm">
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-red-500 rounded"></span> Detractors (0-6)
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-yellow-500 rounded"></span> Passives (7-8)
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-green-500 rounded"></span> Promoters (9-10)
                            </span>
                        </div>
                    </div>
                )}

                {/* Likert Scale Statistics Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Likert Scale Statistics by Category</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Mean</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Median</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Min</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Max</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Std Dev</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(summary.likertStats).map(([key, stats]) => (
                                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900 font-medium">{stats.label}</td>
                                        <td className="py-3 px-4 text-center">{stats.mean}</td>
                                        <td className="py-3 px-4 text-center">{stats.median}</td>
                                        <td className="py-3 px-4 text-center text-red-600">{stats.min}</td>
                                        <td className="py-3 px-4 text-center text-green-600">{stats.max}</td>
                                        <td className="py-3 px-4 text-center">{stats.stdDev}</td>
                                        <td className="py-3 px-4 text-center text-gray-500">{stats.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demographics Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Demographic Distribution</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {genderPieData && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">By Gender</h3>
                                <div className="h-64">
                                    <Doughnut
                                        data={genderPieData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {generationPieData && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">By Generation</h3>
                                <div className="h-64">
                                    <Doughnut
                                        data={generationPieData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Demographics Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Analysis by Demographic Dimension</h2>
                        <div className="flex gap-2">
                            {(['genero', 'geracao', 'tempoDeEmpresa'] as const).map((dim) => (
                                <button
                                    key={dim}
                                    onClick={() => setSelectedDimension(dim)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedDimension === dim
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {dimensionLabels[dim]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {demographicData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {demographicChartData && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Distribution Count</h3>
                                    <div className="h-64">
                                        <Bar
                                            data={demographicChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true } },
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {demographicEnpsData && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">eNPS by {dimensionLabels[selectedDimension]}</h3>
                                    <div className="h-64">
                                        <Bar
                                            data={demographicEnpsData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    y: {
                                                        min: -100,
                                                        max: 100,
                                                        title: { display: true, text: 'eNPS Score' },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {demographicData && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">{dimensionLabels[selectedDimension]}</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">Count</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">% of Total</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">eNPS Score</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">Favorability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demographicData.distribution.map((item) => (
                                        <tr key={item.group} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">{item.group}</td>
                                            <td className="py-3 px-4 text-center">{item.count}</td>
                                            <td className="py-3 px-4 text-center">
                                                {((item.count / demographicData.total) * 100).toFixed(1)}%
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded ${
                                                    item.enps.score >= 50 ? 'bg-green-100 text-green-700' :
                                                    item.enps.score >= 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.enps.score.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">{item.favorability.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Correlation Matrix */}
                {correlations && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Correlation Matrix</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Shows the correlation between different survey dimensions. Green indicates positive correlation, red indicates negative.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr>
                                        <th className="p-2"></th>
                                        {correlations.fields.map((field) => (
                                            <th key={field.key} className="p-2 text-gray-600 font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '120px' }}>
                                                {field.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {correlations.fields.map((rowField) => (
                                        <tr key={rowField.key}>
                                            <td className="p-2 text-gray-600 font-medium whitespace-nowrap">{rowField.label}</td>
                                            {correlations.fields.map((colField) => {
                                                const value = correlations.matrix[rowField.key][colField.key];
                                                return (
                                                    <td
                                                        key={colField.key}
                                                        className={`p-2 text-center ${getCorrelationColor(value)}`}
                                                        title={`${rowField.label} vs ${colField.label}: ${value}`}
                                                    >
                                                        {value.toFixed(2)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-xs">
                            <span className="flex items-center gap-1">
                                <span className="w-4 h-4 bg-green-600 rounded"></span> Strong +
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-4 h-4 bg-green-400 rounded"></span> Moderate +
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-4 h-4 bg-gray-100 border rounded"></span> Weak/None
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-4 h-4 bg-red-400 rounded"></span> Moderate -
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-4 h-4 bg-red-600 rounded"></span> Strong -
                            </span>
                        </div>
                    </div>
                )}

                {/* Response Distribution by Likert Category */}
                {responseDistribution && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Response Distribution by Category (Likert Scale)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {responseDistribution.likert.map((item) => (
                                <div key={item.field} className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 truncate" title={item.label}>
                                        {item.label}
                                    </h3>
                                    <div className="h-32">
                                        <Bar
                                            data={{
                                                labels: ['1', '2', '3', '4', '5'],
                                                datasets: [{
                                                    data: [
                                                        item.distribution[1],
                                                        item.distribution[2],
                                                        item.distribution[3],
                                                        item.distribution[4],
                                                        item.distribution[5],
                                                    ],
                                                    backgroundColor: [
                                                        'rgba(239, 68, 68, 0.7)',
                                                        'rgba(249, 115, 22, 0.7)',
                                                        'rgba(250, 204, 21, 0.7)',
                                                        'rgba(132, 204, 22, 0.7)',
                                                        'rgba(34, 197, 94, 0.7)',
                                                    ],
                                                }],
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    y: { beginAtZero: true, display: false },
                                                    x: { grid: { display: false } },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Exploratory Data Analysis based on {summary.overview.totalSurveys} survey responses from {summary.overview.totalEmployees} employees</p>
                </footer>
            </div>
        </div>
    );
};
