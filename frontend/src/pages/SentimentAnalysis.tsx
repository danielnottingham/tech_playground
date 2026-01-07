import { useEffect, useState, type FC } from 'react';
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

interface SentimentResult {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    positiveCount: number;
    negativeCount: number;
    tokens: string[];
}

interface CommentAnalysis {
    surveyId: number;
    employeeId: number;
    field: string;
    fieldLabel: string;
    text: string;
    sentiment: SentimentResult;
    relatedScore?: number;
}

interface FieldSentimentSummary {
    field: string;
    label: string;
    totalComments: number;
    averageSentiment: number;
    distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

interface SentimentSummary {
    totalComments: number;
    averageSentiment: number;
    distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    byField: FieldSentimentSummary[];
    topPositive: CommentAnalysis[];
    topNegative: CommentAnalysis[];
    wordFrequency: {
        positive: { word: string; count: number }[];
        negative: { word: string; count: number }[];
    };
}

interface Correlation {
    field: string;
    label: string;
    correlation: number;
    dataPoints: number;
}

const getSentimentColor = (label: string): string => {
    switch (label) {
        case 'positive': return 'text-green-600 bg-green-100';
        case 'negative': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const getSentimentEmoji = (label: string): string => {
    switch (label) {
        case 'positive': return '😊';
        case 'negative': return '😞';
        default: return '😐';
    }
};

export const SentimentAnalysis: FC = () => {
    const [summary, setSummary] = useState<SentimentSummary | null>(null);
    const [correlations, setCorrelations] = useState<Correlation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'comments'>('overview');
    const [selectedField, setSelectedField] = useState<string>('');
    const [customText, setCustomText] = useState('');
    const [customResult, setCustomResult] = useState<SentimentResult | null>(null);
    const [analyzingText, setAnalyzingText] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, correlationRes] = await Promise.all([
                    api.get('/sentiment/summary'),
                    api.get('/sentiment/correlation'),
                ]);
                setSummary(summaryRes.data);
                setCorrelations(correlationRes.data);
            } catch (err) {
                console.error('Error fetching sentiment data:', err);
                setError('Failed to load sentiment data. Please ensure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const analyzeCustomText = async () => {
        if (!customText.trim()) return;
        setAnalyzingText(true);
        try {
            const response = await api.post('/sentiment/analyze', { text: customText });
            setCustomResult(response.data.sentiment);
        } catch (err) {
            console.error('Error analyzing text:', err);
        } finally {
            setAnalyzingText(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sentiment analysis...</p>
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

    const distributionData = {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [
            {
                data: [summary.distribution.positive, summary.distribution.neutral, summary.distribution.negative],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(156, 163, 175, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(156, 163, 175)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const distributionOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const total = summary.totalComments;
                        const value = context.raw;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
    };

    const fieldBarData = {
        labels: summary.byField.map(f => f.label),
        datasets: [
            {
                label: 'Average Sentiment',
                data: summary.byField.map(f => f.averageSentiment),
                backgroundColor: summary.byField.map(f =>
                    f.averageSentiment > 0.1 ? 'rgba(34, 197, 94, 0.6)' :
                    f.averageSentiment < -0.1 ? 'rgba(239, 68, 68, 0.6)' :
                    'rgba(156, 163, 175, 0.6)'
                ),
                borderColor: summary.byField.map(f =>
                    f.averageSentiment > 0.1 ? 'rgb(34, 197, 94)' :
                    f.averageSentiment < -0.1 ? 'rgb(239, 68, 68)' :
                    'rgb(156, 163, 175)'
                ),
                borderWidth: 1,
            },
        ],
    };

    const fieldBarOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                min: -1,
                max: 1,
                title: {
                    display: true,
                    text: 'Sentiment Score (-1 to +1)'
                }
            }
        }
    };

    const correlationBarData = {
        labels: correlations.map(c => c.label),
        datasets: [
            {
                label: 'Correlation',
                data: correlations.map(c => c.correlation),
                backgroundColor: correlations.map(c =>
                    c.correlation > 0 ? 'rgba(99, 102, 241, 0.6)' : 'rgba(239, 68, 68, 0.6)'
                ),
                borderColor: correlations.map(c =>
                    c.correlation > 0 ? 'rgb(99, 102, 241)' : 'rgb(239, 68, 68)'
                ),
                borderWidth: 1,
            },
        ],
    };

    const correlationBarOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                min: -1,
                max: 1,
                title: {
                    display: true,
                    text: 'Correlation Coefficient'
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Sentiment Analysis</h1>
                    <p className="text-gray-500 mt-2">Analysis of employee comments using Portuguese NLP lexicon-based approach</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Total Comments</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalComments.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Avg. Sentiment</p>
                        <p className={`text-3xl font-bold mt-2 ${summary.averageSentiment > 0 ? 'text-green-600' : summary.averageSentiment < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {summary.averageSentiment > 0 ? '+' : ''}{summary.averageSentiment.toFixed(3)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Positive</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {((summary.distribution.positive / summary.totalComments) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">{summary.distribution.positive} comments</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Negative</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                            {((summary.distribution.negative / summary.totalComments) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">{summary.distribution.negative} comments</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'fields', label: 'By Field' },
                                { id: 'comments', label: 'Sample Comments' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
                                    <div className="h-64">
                                        <Doughnut data={distributionData} options={distributionOptions} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment vs. Score Correlation</h3>
                                    <div className="h-64">
                                        <Bar data={correlationBarData} options={correlationBarOptions} />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Higher correlation = sentiment aligns with numeric score
                                    </p>
                                </div>
                                <div className="lg:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Frequency</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-green-600 mb-2">Top Positive Words</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {summary.wordFrequency.positive.slice(0, 15).map((w, i) => (
                                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                        {w.word} ({w.count})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-red-600 mb-2">Top Negative Words</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {summary.wordFrequency.negative.slice(0, 15).map((w, i) => (
                                                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                                        {w.word} ({w.count})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment by Comment Field</h3>
                                <div className="h-80 mb-6">
                                    <Bar data={fieldBarData} options={fieldBarOptions} />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Field</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Comments</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Avg. Sentiment</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Positive</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Neutral</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Negative</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.byField.map((field, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900 font-medium">{field.label}</td>
                                                    <td className="py-3 px-4 text-center">{field.totalComments}</td>
                                                    <td className={`py-3 px-4 text-center font-medium ${
                                                        field.averageSentiment > 0.1 ? 'text-green-600' :
                                                        field.averageSentiment < -0.1 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {field.averageSentiment > 0 ? '+' : ''}{field.averageSentiment.toFixed(3)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-green-600">{field.distribution.positive}</td>
                                                    <td className="py-3 px-4 text-center text-gray-500">{field.distribution.neutral}</td>
                                                    <td className="py-3 px-4 text-center text-red-600">{field.distribution.negative}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-green-600 mb-4">Top Positive Comments</h3>
                                    <div className="space-y-3">
                                        {summary.topPositive.slice(0, 5).map((comment, i) => (
                                            <div key={i} className="p-4 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-green-700">{comment.fieldLabel}</span>
                                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                                        Score: {comment.sentiment.score.toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-600 mb-4">Top Negative Comments</h3>
                                    <div className="space-y-3">
                                        {summary.topNegative.slice(0, 5).map((comment, i) => (
                                            <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-red-700">{comment.fieldLabel}</span>
                                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                                                        Score: {comment.sentiment.score.toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Text Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Try It: Analyze Custom Text</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder="Enter Portuguese text to analyze..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyPress={(e) => e.key === 'Enter' && analyzeCustomText()}
                        />
                        <button
                            onClick={analyzeCustomText}
                            disabled={analyzingText || !customText.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzingText ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                    {customResult && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{getSentimentEmoji(customResult.label)}</span>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(customResult.label)}`}>
                                        {customResult.label.toUpperCase()}
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Score: <span className="font-medium">{customResult.score.toFixed(3)}</span> |
                                        Confidence: <span className="font-medium">{(customResult.confidence * 100).toFixed(0)}%</span> |
                                        Positive words: <span className="text-green-600 font-medium">{customResult.positiveCount}</span> |
                                        Negative words: <span className="text-red-600 font-medium">{customResult.negativeCount}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Analysis based on {summary.totalComments.toLocaleString()} comments from survey responses</p>
                    <p className="mt-1">Using Portuguese lexicon-based sentiment analysis with negation and intensifier handling</p>
                </footer>
            </div>
        </div>
    );
};
