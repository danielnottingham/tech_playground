import { useEffect, useState, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MetricsCard } from '../components/MetricsCard';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Area {
    id: number;
    n0Empresa: string;
    n1Diretoria: string;
    n2Gerencia: string;
    n3Coordenacao: string;
    n4Area: string;
}

interface EmployeeComparison {
    employee: {
        id: number;
        nome: string;
        email: string;
        cargo: string;
        funcao: string;
        localidade: string;
        tempoDeEmpresa: string;
        genero: string;
        geracao: string;
        area: Area;
    };
    stats: {
        total_surveys: number;
        enps: { score: number; promoters: number; passives: number; detractors: number; total: number };
        favorability: number;
        averages: Record<string, number>;
    };
    comparison: {
        company: {
            enps: { score: number };
            favorability: number;
            averages: Record<string, number>;
        };
        area: {
            enps: { score: number };
            favorability: number;
            averages: Record<string, number>;
        } | null;
    };
}

const CATEGORY_LABELS: Record<string, string> = {
    interesseNoCargo: 'Interesse no Cargo',
    contribuicao: 'Contribuição',
    aprendizado: 'Aprendizado',
    feedback: 'Feedback',
    interacaoGestor: 'Interação com Gestor',
    clarezaCarreira: 'Clareza de Carreira',
    expectativaPermanencia: 'Expectativa de Permanência',
};

const getEnpsColor = (score: number): string => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
};

const getEnpsLabel = (score: number): string => {
    if (score >= 50) return 'Excelente';
    if (score >= 30) return 'Bom';
    if (score >= 0) return 'Moderado';
    return 'Precisa Melhorar';
};

const getComparisonIndicator = (value: number, reference: number): { text: string; color: string } => {
    const diff = value - reference;
    if (Math.abs(diff) < 0.1) return { text: 'Igual', color: 'text-gray-500' };
    if (diff > 0) return { text: `+${diff.toFixed(1)}`, color: 'text-green-600' };
    return { text: diff.toFixed(1), color: 'text-red-600' };
};

export const EmployeeDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<EmployeeComparison | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get<EmployeeComparison>(`/stats/employees/${id}/comparison`);
                setData(response.data);
            } catch (err) {
                console.error('Error fetching employee data:', err);
                setError('Falha ao carregar dados do colaborador. Verifique se o backend está em execução.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dados do colaborador...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-500 text-lg">{error || 'Colaborador não encontrado.'}</p>
                    <Link
                        to="/employees"
                        className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Voltar para Colaboradores
                    </Link>
                </div>
            </div>
        );
    }

    const { employee, stats, comparison } = data;

    const radarData = {
        labels: Object.keys(stats.averages).map(k => CATEGORY_LABELS[k] || k),
        datasets: [
            {
                label: 'Colaborador',
                data: Object.values(stats.averages),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(99, 102, 241)',
            },
            {
                label: 'Média da Empresa',
                data: Object.keys(stats.averages).map(k => comparison.company.averages[k] || 0),
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                borderColor: 'rgb(156, 163, 175)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(156, 163, 175)',
            },
            ...(comparison.area ? [{
                label: 'Média da Área',
                data: Object.keys(stats.averages).map(k => comparison.area?.averages[k] || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(34, 197, 94)',
            }] : []),
        ],
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0,
                max: 5,
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    const comparisonBarData = {
        labels: Object.keys(stats.averages).map(k => CATEGORY_LABELS[k] || k),
        datasets: [
            {
                label: 'Colaborador',
                data: Object.values(stats.averages),
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
            },
            {
                label: 'Média da Empresa',
                data: Object.keys(stats.averages).map(k => comparison.company.averages[k] || 0),
                backgroundColor: 'rgba(156, 163, 175, 0.7)',
                borderColor: 'rgb(156, 163, 175)',
                borderWidth: 1,
            },
            ...(comparison.area ? [{
                label: 'Média da Área',
                data: Object.keys(stats.averages).map(k => comparison.area?.averages[k] || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
            }] : []),
        ],
    };

    const comparisonBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                title: {
                    display: true,
                    text: 'Pontuação (1-5)',
                },
            },
        },
    };

    const getAreaName = () => {
        if (!employee.area) return 'Não atribuído';
        return employee.area.n4Area || employee.area.n3Coordenacao || employee.area.n2Gerencia || employee.area.n1Diretoria || employee.area.n0Empresa;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Link */}
                <div className="mb-6">
                    <Link
                        to="/employees"
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar para Colaboradores
                    </Link>
                </div>

                {/* Employee Profile Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{employee.nome}</h1>
                            <p className="text-gray-500 mt-1">{employee.email}</p>
                            <div className="flex flex-wrap gap-3 mt-3">
                                {employee.cargo && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                                        {employee.cargo}
                                    </span>
                                )}
                                {employee.funcao && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                                        {employee.funcao}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-5xl font-bold ${getEnpsColor(stats.enps.score)}`}>
                                {stats.total_surveys > 0 ? stats.enps.score.toFixed(0) : '-'}
                            </div>
                            <p className={`text-sm ${getEnpsColor(stats.enps.score)}`}>
                                {stats.total_surveys > 0 ? getEnpsLabel(stats.enps.score) : 'Sem dados'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Pontuação eNPS</p>
                        </div>
                    </div>
                </div>

                {/* Employee Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricsCard
                        title="Área"
                        value={getAreaName()}
                        description={employee.area?.n2Gerencia || ''}
                    />
                    <MetricsCard
                        title="Tempo de Casa"
                        value={employee.tempoDeEmpresa || 'Não especificado'}
                        description="Tempo de empresa"
                    />
                    <MetricsCard
                        title="Localidade"
                        value={employee.localidade || 'Não especificado'}
                        description="Local de trabalho"
                    />
                    <MetricsCard
                        title="Pesquisas"
                        value={stats.total_surveys}
                        description="Respostas enviadas"
                    />
                </div>

                {/* Demographics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Perfil do Colaborador</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Gênero</p>
                            <p className="text-lg font-medium text-gray-900">{employee.genero || 'Não especificado'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Geração</p>
                            <p className="text-lg font-medium text-gray-900">{employee.geracao || 'Não especificado'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Favorabilidade</p>
                            <p className="text-lg font-medium text-gray-900">
                                {stats.total_surveys > 0 ? `${stats.favorability.toFixed(1)}%` : '-'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Hierarquia da Área</p>
                            <p className="text-lg font-medium text-gray-900">{employee.area?.n1Diretoria || '-'}</p>
                        </div>
                    </div>
                </div>

                {stats.total_surveys > 0 ? (
                    <>
                        {/* Key Metrics Comparison */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Comparação de Métricas Chave</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Métrica</th>
                                            <th className="text-center py-3 px-4 font-medium text-indigo-600">Colaborador</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-600">Média Empresa</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-600">vs Empresa</th>
                                            {comparison.area && (
                                                <>
                                                    <th className="text-center py-3 px-4 font-medium text-green-600">Média Área</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-600">vs Área</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">eNPS</td>
                                            <td className="py-3 px-4 text-center font-bold text-indigo-600">{stats.enps.score.toFixed(1)}</td>
                                            <td className="py-3 px-4 text-center">{comparison.company.enps.score.toFixed(1)}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={getComparisonIndicator(stats.enps.score, comparison.company.enps.score).color}>
                                                    {getComparisonIndicator(stats.enps.score, comparison.company.enps.score).text}
                                                </span>
                                            </td>
                                            {comparison.area && (
                                                <>
                                                    <td className="py-3 px-4 text-center">{comparison.area.enps.score.toFixed(1)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={getComparisonIndicator(stats.enps.score, comparison.area.enps.score).color}>
                                                            {getComparisonIndicator(stats.enps.score, comparison.area.enps.score).text}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">Favorabilidade</td>
                                            <td className="py-3 px-4 text-center font-bold text-indigo-600">{stats.favorability.toFixed(1)}%</td>
                                            <td className="py-3 px-4 text-center">{comparison.company.favorability.toFixed(1)}%</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={getComparisonIndicator(stats.favorability, comparison.company.favorability).color}>
                                                    {getComparisonIndicator(stats.favorability, comparison.company.favorability).text}%
                                                </span>
                                            </td>
                                            {comparison.area && (
                                                <>
                                                    <td className="py-3 px-4 text-center">{comparison.area.favorability.toFixed(1)}%</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={getComparisonIndicator(stats.favorability, comparison.area.favorability).color}>
                                                            {getComparisonIndicator(stats.favorability, comparison.area.favorability).text}%
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Radar Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Comparação de Pontuações (Radar)</h2>
                                <div className="h-80">
                                    <Radar data={radarData} options={radarOptions} />
                                </div>
                            </div>

                            {/* Bar Chart Comparison */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Comparação de Pontuações (Barra)</h2>
                                <div className="h-80">
                                    <Bar data={comparisonBarData} options={comparisonBarOptions} />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Category Comparison */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Pontuações Detalhadas por Categoria</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                                            <th className="text-center py-3 px-4 font-medium text-indigo-600">Colaborador</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-600">Empresa</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-600">vs Empresa</th>
                                            {comparison.area && (
                                                <>
                                                    <th className="text-center py-3 px-4 font-medium text-green-600">Área</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-600">vs Área</th>
                                                </>
                                            )}
                                            <th className="text-left py-3 px-4 font-medium text-gray-600">Desempenho</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(stats.averages).map(([key, value]) => {
                                            const companyValue = comparison.company.averages[key] || 0;
                                            const areaValue = comparison.area?.averages[key] || 0;
                                            const percentage = (value / 5) * 100;
                                            const barColor = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500';

                                            return (
                                                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900 font-medium">{CATEGORY_LABELS[key] || key}</td>
                                                    <td className="py-3 px-4 text-center font-bold text-indigo-600">{value.toFixed(2)}</td>
                                                    <td className="py-3 px-4 text-center">{companyValue.toFixed(2)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={getComparisonIndicator(value, companyValue).color}>
                                                            {getComparisonIndicator(value, companyValue).text}
                                                        </span>
                                                    </td>
                                                    {comparison.area && (
                                                        <>
                                                            <td className="py-3 px-4 text-center">{areaValue.toFixed(2)}</td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={getComparisonIndicator(value, areaValue).color}>
                                                                    {getComparisonIndicator(value, areaValue).text}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
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

                        {/* Insights Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Principais Insights</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">Pontos Fortes</h3>
                                    <ul className="space-y-2">
                                        {Object.entries(stats.averages)
                                            .filter(([, v]) => v >= 4)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3)
                                            .map(([key, value]) => (
                                                <li key={key} className="flex justify-between text-sm">
                                                    <span className="text-green-700">{CATEGORY_LABELS[key] || key}</span>
                                                    <span className="font-medium text-green-800">{value.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        {Object.entries(stats.averages).filter(([, v]) => v >= 4).length === 0 && (
                                            <li className="text-sm text-green-700">Nenhuma categoria com pontuação 4 ou superior</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <h3 className="text-lg font-semibold text-amber-800 mb-2">Áreas de Desenvolvimento</h3>
                                    <ul className="space-y-2">
                                        {Object.entries(stats.averages)
                                            .filter(([, v]) => v < 4)
                                            .sort(([, a], [, b]) => a - b)
                                            .slice(0, 3)
                                            .map(([key, value]) => (
                                                <li key={key} className="flex justify-between text-sm">
                                                    <span className="text-amber-700">{CATEGORY_LABELS[key] || key}</span>
                                                    <span className="font-medium text-amber-800">{value.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        {Object.entries(stats.averages).filter(([, v]) => v < 4).length === 0 && (
                                            <li className="text-sm text-amber-700">Todas as categorias estão na meta ou acima</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum Dado de Pesquisa Disponível</h3>
                        <p className="text-gray-500">Este colaborador ainda não enviou nenhuma resposta à pesquisa.</p>
                    </div>
                )}

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Perfil do colaborador e análise de pesquisa para {employee.nome}</p>
                </footer>
            </div>
        </div>
    );
};
