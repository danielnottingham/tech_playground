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
import { Link } from 'react-router-dom';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

interface RiskFactor {
    factor: string;
    label: string;
    value: number;
    weight: number;
    contribution: number;
    description: string;
}

interface EmployeeRiskAssessment {
    employeeId: number;
    employeeName: string;
    email: string;
    area: string;
    cargo: string;
    riskScore: number;
    riskLevel: RiskLevel;
    factors: RiskFactor[];
    recommendations: string[];
}

interface AttritionRiskSummary {
    totalEmployees: number;
    assessedEmployees: number;
    averageRiskScore: number;
    riskDistribution: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
    };
    topRiskFactors: {
        factor: string;
        label: string;
        avgContribution: number;
        affectedCount: number;
    }[];
    riskByDemographic: {
        byGeneration: Record<string, { count: number; avgRisk: number }>;
        byTenure: Record<string, { count: number; avgRisk: number }>;
        byArea: Record<string, { count: number; avgRisk: number }>;
    };
}

interface CareerClarityAnalysis {
    hypothesis: string;
    findings: {
        lowClarityAvgRisk: number;
        highClarityAvgRisk: number;
        correlation: number;
        conclusion: string;
    };
    details: {
        clarityScore: number;
        count: number;
        avgRiskScore: number;
    }[];
}

interface TenurePatternAnalysis {
    hypothesis: string;
    findings: {
        highestRiskTenure: string;
        lowestRiskTenure: string;
        pattern: string;
    };
    details: {
        tenure: string;
        count: number;
        avgRiskScore: number;
        distribution: { critical: number; high: number; moderate: number; low: number };
    }[];
}

const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
        case 'critical': return 'text-red-700 bg-red-100 border-red-300';
        case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
        case 'moderate': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
        case 'low': return 'text-green-700 bg-green-100 border-green-300';
    }
};

const getRiskBgColor = (level: RiskLevel): string => {
    switch (level) {
        case 'critical': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'moderate': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
    }
};

const getRiskLabel = (level: RiskLevel): string => {
    switch (level) {
        case 'critical': return 'Critico';
        case 'high': return 'Alto';
        case 'moderate': return 'Moderado';
        case 'low': return 'Baixo';
    }
};

export const AttritionRisk: FC = () => {
    const [summary, setSummary] = useState<AttritionRiskSummary | null>(null);
    const [highRiskEmployees, setHighRiskEmployees] = useState<EmployeeRiskAssessment[]>([]);
    const [careerAnalysis, setCareerAnalysis] = useState<CareerClarityAnalysis | null>(null);
    const [tenureAnalysis, setTenureAnalysis] = useState<TenurePatternAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'analysis'>('overview');
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRiskAssessment | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, highRiskRes, careerRes, tenureRes] = await Promise.all([
                    api.get('/attrition-risk/summary'),
                    api.get('/attrition-risk/high-risk?limit=20'),
                    api.get('/attrition-risk/analysis/career-clarity'),
                    api.get('/attrition-risk/analysis/tenure-pattern'),
                ]);
                setSummary(summaryRes.data);
                setHighRiskEmployees(highRiskRes.data);
                setCareerAnalysis(careerRes.data);
                setTenureAnalysis(tenureRes.data);
            } catch (err) {
                console.error('Error fetching attrition risk data:', err);
                setError('Falha ao carregar dados de risco de atrito. Por favor verifique se o backend está rodando.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando análise de risco de atrito...</p>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-500 text-lg">{error || 'Erro ao carregar dados.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    const distributionData = {
        labels: ['Critico', 'Alto', 'Moderado', 'Baixo'],
        datasets: [
            {
                data: [
                    summary.riskDistribution.critical,
                    summary.riskDistribution.high,
                    summary.riskDistribution.moderate,
                    summary.riskDistribution.low,
                ],
                backgroundColor: [
                    'rgba(220, 38, 38, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                ],
                borderColor: [
                    'rgb(220, 38, 38)',
                    'rgb(249, 115, 22)',
                    'rgb(234, 179, 8)',
                    'rgb(34, 197, 94)',
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
                        const total = summary.assessedEmployees;
                        const value = context.raw;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
    };

    const factorsBarData = {
        labels: summary.topRiskFactors.map(f => f.label),
        datasets: [
            {
                label: 'Contribuição Média',
                data: summary.topRiskFactors.map(f => f.avgContribution * 100),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
            },
        ],
    };

    const factorsBarOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                min: 0,
                max: 30,
                title: {
                    display: true,
                    text: 'Contribuição para o Risco (%)'
                }
            }
        }
    };

    const generationData = Object.entries(summary.riskByDemographic.byGeneration);
    const generationBarData = {
        labels: generationData.map(([gen]) => gen),
        datasets: [
            {
                label: 'Risco Médio',
                data: generationData.map(([, data]) => data.avgRisk),
                backgroundColor: generationData.map(([, data]) =>
                    data.avgRisk >= 50 ? 'rgba(220, 38, 38, 0.6)' :
                        data.avgRisk >= 30 ? 'rgba(234, 179, 8, 0.6)' :
                            'rgba(34, 197, 94, 0.6)'
                ),
                borderColor: generationData.map(([, data]) =>
                    data.avgRisk >= 50 ? 'rgb(220, 38, 38)' :
                        data.avgRisk >= 30 ? 'rgb(234, 179, 8)' :
                            'rgb(34, 197, 94)'
                ),
                borderWidth: 1,
            },
        ],
    };

    const generationBarOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Risco Médio (%)'
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Análise de Risco de Atrito</h1>
                    <p className="text-gray-500 mt-2">
                        Exploração criativa: Identificação de colaboradores em risco de desligamento através de análise multifatorial
                    </p>
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <p className="text-sm text-indigo-800">
                            <strong>Hipótese:</strong> Podemos prever o risco de atrito combinando múltiplos fatores como expectativa de permanência,
                            eNPS, clareza de carreira, interação com gestor e sentimento dos comentários.
                        </p>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Colaboradores Avaliados</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{summary.assessedEmployees}</p>
                        <p className="text-sm text-gray-400">de {summary.totalEmployees} total</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Risco Médio</p>
                        <p className={`text-3xl font-bold mt-2 ${summary.averageRiskScore >= 50 ? 'text-red-600' :
                            summary.averageRiskScore >= 30 ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>
                            {summary.averageRiskScore.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Alto Risco</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                            {summary.riskDistribution.critical + summary.riskDistribution.high}
                        </p>
                        <p className="text-sm text-gray-400">colaboradores em alerta</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">Risco Baixo</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {summary.riskDistribution.low}
                        </p>
                        <p className="text-sm text-gray-400">colaboradores estáveis</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'overview', label: 'Visão Geral' },
                                { id: 'employees', label: 'Colaboradores em Risco' },
                                { id: 'analysis', label: 'Análise de Hipóteses' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === tab.id
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
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Risco</h3>
                                    <div className="h-64">
                                        <Doughnut data={distributionData} options={distributionOptions} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Principais Fatores de Risco</h3>
                                    <div className="h-64">
                                        <Bar data={factorsBarData} options={factorsBarOptions} />
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risco por Geração</h3>
                                    <div className="h-64">
                                        <Bar data={generationBarData} options={generationBarOptions} />
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risco por Tempo de Empresa</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo de Empresa</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Colaboradores</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Risco Médio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(summary.riskByDemographic.byTenure)
                                                    .sort(([, a], [, b]) => b.avgRisk - a.avgRisk)
                                                    .map(([tenure, data], i) => (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-3 px-4 text-gray-900 font-medium">{tenure}</td>
                                                            <td className="py-3 px-4 text-center">{data.count}</td>
                                                            <td className={`py-3 px-4 text-center font-medium ${data.avgRisk >= 50 ? 'text-red-600' :
                                                                data.avgRisk >= 30 ? 'text-yellow-600' :
                                                                    'text-green-600'
                                                                }`}>
                                                                {data.avgRisk.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'employees' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Colaboradores em Alto Risco</h3>
                                    <span className="text-sm text-gray-500">
                                        {highRiskEmployees.length} colaboradores identificados
                                    </span>
                                </div>

                                {selectedEmployee && (
                                    <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900">{selectedEmployee.employeeName}</h4>
                                                <p className="text-gray-500">{selectedEmployee.cargo} - {selectedEmployee.area}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedEmployee(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                Fechar
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h5 className="font-medium text-gray-700 mb-3">Fatores de Risco</h5>
                                                <div className="space-y-2">
                                                    {selectedEmployee.factors.map((factor, i) => (
                                                        <div key={i} className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{factor.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${factor.value > 0.6 ? 'bg-red-500' : factor.value > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${factor.value * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs text-gray-500 w-12 text-right">
                                                                    {(factor.contribution * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-gray-700 mb-3">Recomendações</h5>
                                                <ul className="space-y-2">
                                                    {selectedEmployee.recommendations.map((rec, i) => (
                                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                            <span className="text-indigo-500 mt-1">•</span>
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Link
                                                to={`/employees/${selectedEmployee.employeeId}`}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Ver perfil completo
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Colaborador</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Área</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Cargo</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Score de Risco</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Nível</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-600">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {highRiskEmployees.map((emp, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900">{emp.employeeName}</div>
                                                        <div className="text-xs text-gray-500">{emp.email}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">{emp.area}</td>
                                                    <td className="py-3 px-4 text-gray-600">{emp.cargo}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className={getRiskBgColor(emp.riskLevel)}
                                                                    style={{ width: `${emp.riskScore}%`, height: '100%' }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 w-12">
                                                                {emp.riskScore.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(emp.riskLevel)}`}>
                                                            {getRiskLabel(emp.riskLevel)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedEmployee(emp)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                        >
                                                            Ver detalhes
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analysis' && careerAnalysis && tenureAnalysis && (
                            <div className="space-y-8">
                                {/* Career Clarity Analysis */}
                                <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Análise: Impacto da Clareza de Carreira</h3>
                                    <p className="text-sm text-indigo-700 mb-4 italic">"{careerAnalysis.hypothesis}"</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Risco - Baixa Clareza (1-2)</p>
                                            <p className="text-2xl font-bold text-red-600">{careerAnalysis.findings.lowClarityAvgRisk.toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Risco - Alta Clareza (4-5)</p>
                                            <p className="text-2xl font-bold text-green-600">{careerAnalysis.findings.highClarityAvgRisk.toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Correlação</p>
                                            <p className={`text-2xl font-bold ${careerAnalysis.findings.correlation < 0 ? 'text-indigo-600' : 'text-gray-600'}`}>
                                                {careerAnalysis.findings.correlation.toFixed(3)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700">Conclusão:</p>
                                        <p className="text-gray-600">{careerAnalysis.findings.conclusion}</p>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes por Score de Clareza</h4>
                                        <div className="flex gap-2">
                                            {careerAnalysis.details.map((d, i) => (
                                                <div key={i} className="flex-1 bg-white p-3 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Clareza {d.clarityScore}</p>
                                                    <p className="text-lg font-bold text-gray-900">{d.avgRiskScore.toFixed(1)}%</p>
                                                    <p className="text-xs text-gray-400">{d.count} pessoas</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Tenure Pattern Analysis */}
                                <div className="p-6 bg-amber-50 rounded-lg border border-amber-100">
                                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Análise: Padrão por Tempo de Empresa</h3>
                                    <p className="text-sm text-amber-700 mb-4 italic">"{tenureAnalysis.hypothesis}"</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Maior Risco</p>
                                            <p className="text-xl font-bold text-red-600">{tenureAnalysis.findings.highestRiskTenure}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Menor Risco</p>
                                            <p className="text-xl font-bold text-green-600">{tenureAnalysis.findings.lowestRiskTenure}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg mb-4">
                                        <p className="text-sm font-medium text-gray-700">Padrão Identificado:</p>
                                        <p className="text-gray-600">{tenureAnalysis.findings.pattern}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Distribuição por Tenure</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 px-3 font-medium text-gray-600">Tempo de Empresa</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Total</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Risco Médio</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Critico</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Alto</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Moderado</th>
                                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Baixo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tenureAnalysis.details.map((d, i) => (
                                                        <tr key={i} className="border-b border-gray-100">
                                                            <td className="py-2 px-3 font-medium text-gray-900">{d.tenure}</td>
                                                            <td className="py-2 px-3 text-center">{d.count}</td>
                                                            <td className={`py-2 px-3 text-center font-medium ${d.avgRiskScore >= 50 ? 'text-red-600' :
                                                                d.avgRiskScore >= 30 ? 'text-yellow-600' :
                                                                    'text-green-600'
                                                                }`}>{d.avgRiskScore.toFixed(1)}%</td>
                                                            <td className="py-2 px-3 text-center text-red-600">{d.distribution.critical}</td>
                                                            <td className="py-2 px-3 text-center text-orange-600">{d.distribution.high}</td>
                                                            <td className="py-2 px-3 text-center text-yellow-600">{d.distribution.moderate}</td>
                                                            <td className="py-2 px-3 text-center text-green-600">{d.distribution.low}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Methodology */}
                                <div className="p-6 bg-gray-100 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Metodologia</h3>
                                    <div className="prose prose-sm text-gray-600">
                                        <p>O score de risco de atrito é calculado combinando múltiplos fatores com pesos específicos:</p>
                                        <ul className="mt-2">
                                            <li><strong>Expectativa de Permanência (25%)</strong>: Indicador mais direto de intenção de ficar</li>
                                            <li><strong>Score eNPS (20%)</strong>: Indicador geral de satisfação e lealdade</li>
                                            <li><strong>Clareza de Carreira (15%)</strong>: Oportunidades de desenvolvimento</li>
                                            <li><strong>Interação com Gestor (12%)</strong>: Qualidade do relacionamento com liderança</li>
                                            <li><strong>Sentimento dos Comentários (10%)</strong>: Análise de sentimento via NLP</li>
                                            <li><strong>Feedback (8%)</strong>: Percepção da qualidade do feedback</li>
                                            <li><strong>Aprendizado (5%)</strong>: Oportunidades de desenvolvimento</li>
                                            <li><strong>Contribuição (5%)</strong>: Senso de contribuição para a equipe</li>
                                        </ul>
                                        <p className="mt-4">
                                            O algoritmo inverte as pontuações (notas baixas = alto risco) e normaliza para uma escala de 0-100.
                                            Colaboradores com score acima de 70% são classificados como risco crítico, acima de 50% como alto,
                                            acima de 30% como moderado, e abaixo de 30% como baixo risco.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Análise baseada em {summary.assessedEmployees} colaboradores avaliados</p>
                    <p className="mt-1">Task 12: Exploração Criativa - Predição de Risco de Atrito</p>
                </footer>
            </div>
        </div>
    );
};
