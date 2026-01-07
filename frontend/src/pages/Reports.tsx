import { useEffect, useState, type FC } from 'react';
import api from '../services/api';

interface Area {
    id: number;
    n0Empresa: string;
    n1Diretoria: string;
    n2Gerencia: string;
    n3Coordenacao: string;
    n4Area: string;
}

interface Employee {
    id: number;
    nome: string;
    email: string;
    cargo: string;
}

type ReportType = 'company' | 'area' | 'employee';

export const Reports: FC = () => {
    const [reportType, setReportType] = useState<ReportType>('company');
    const [areas, setAreas] = useState<Area[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState<string>('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [areasRes, employeesRes] = await Promise.all([
                    api.get('/areas'),
                    api.get('/employees?limit=500'),
                ]);
                setAreas(areasRes.data);
                setEmployees(employeesRes.data.data || employeesRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    const getAreaName = (area: Area): string => {
        return area.n4Area || area.n3Coordenacao || area.n2Gerencia || area.n1Diretoria || area.n0Empresa;
    };

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        setPreviewHtml(null);

        try {
            let endpoint = '';
            switch (reportType) {
                case 'company':
                    endpoint = '/reports/company?format=html';
                    break;
                case 'area':
                    if (!selectedAreaId) {
                        setError('Selecione uma área');
                        setLoading(false);
                        return;
                    }
                    endpoint = `/reports/areas/${selectedAreaId}?format=html`;
                    break;
                case 'employee':
                    if (!selectedEmployeeId) {
                        setError('Selecione um colaborador');
                        setLoading(false);
                        return;
                    }
                    endpoint = `/reports/employees/${selectedEmployeeId}?format=html`;
                    break;
            }

            const response = await api.get(endpoint);
            setPreviewHtml(response.data.html);
        } catch (err: any) {
            console.error('Error generating report:', err);
            setError(err.response?.data?.message || 'Falha ao gerar relatório');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async () => {
        setLoading(true);
        setError(null);

        try {
            let endpoint = '';
            let filename = '';

            switch (reportType) {
                case 'company':
                    endpoint = '/reports/company/download';
                    filename = `relatorio-empresa-${new Date().toISOString().split('T')[0]}.html`;
                    break;
                case 'area':
                    if (!selectedAreaId) {
                        setError('Selecione uma área');
                        setLoading(false);
                        return;
                    }
                    endpoint = `/reports/areas/${selectedAreaId}/download`;
                    const area = areas.find(a => a.id === Number(selectedAreaId));
                    filename = `relatorio-area-${getAreaName(area!).replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
                    break;
                case 'employee':
                    if (!selectedEmployeeId) {
                        setError('Selecione um colaborador');
                        setLoading(false);
                        return;
                    }
                    endpoint = `/reports/employees/${selectedEmployeeId}/download`;
                    const emp = employees.find(e => e.id === Number(selectedEmployeeId));
                    filename = `relatorio-funcionario-${emp!.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
                    break;
            }

            const response = await api.get(endpoint, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error downloading report:', err);
            setError(err.response?.data?.message || 'Falha ao baixar relatório');
        } finally {
            setLoading(false);
        }
    };

    const printReport = () => {
        if (!previewHtml) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(previewHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Geração de Relatórios</h1>
                    <p className="text-gray-500 mt-2">Gere e baixe relatórios completos com métricas e insights principais</p>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Selecione o Tipo de Relatório</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={() => {
                                setReportType('company');
                                setPreviewHtml(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all ${reportType === 'company'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Relatório da Empresa</h3>
                                <p className="text-sm text-gray-500 mt-1">Visão geral da empresa</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setReportType('area');
                                setPreviewHtml(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all ${reportType === 'area'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Relatório de Área</h3>
                                <p className="text-sm text-gray-500 mt-1">Análise por departamento</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setReportType('employee');
                                setPreviewHtml(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all ${reportType === 'employee'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Relatório de Colaborador</h3>
                                <p className="text-sm text-gray-500 mt-1">Desempenho individual</p>
                            </div>
                        </button>
                    </div>

                    {reportType === 'area' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Selecione a Área</label>
                            <select
                                value={selectedAreaId}
                                onChange={(e) => {
                                    setSelectedAreaId(e.target.value);
                                    setPreviewHtml(null);
                                }}
                                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">-- Selecione uma área --</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {getAreaName(area)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'employee' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Colaborador</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => {
                                    setSelectedEmployeeId(e.target.value);
                                    setPreviewHtml(null);
                                }}
                                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">-- Selecione um colaborador --</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nome} ({emp.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Visualizar Relatório
                                </>
                            )}
                        </button>

                        <button
                            onClick={downloadReport}
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar HTML
                        </button>

                        {previewHtml && (
                            <button
                                onClick={printReport}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Imprimir / Salvar como PDF
                            </button>
                        )}
                    </div>
                </div>

                {previewHtml && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Pré-visualização do Relatório</h2>
                            <span className="text-sm text-gray-500">Use Imprimir / Salvar como PDF para exportar.</span>
                        </div>
                        <div className="p-4">
                            <iframe
                                srcDoc={previewHtml}
                                className="w-full border border-gray-200 rounded-lg"
                                style={{ height: '800px' }}
                                title="Report Preview"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Informações sobre Relatórios</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li><strong>Relatório da Empresa:</strong> Inclui eNPS geral, favorabilidade, dados demográficos e áreas com melhor/pior desempenho.</li>
                        <li><strong>Relatório de Área:</strong> Mostra métricas específicas da área comparadas com a média da empresa.</li>
                        <li><strong>Relatório de Colaborador:</strong> Desempenho individual comparado com médias da empresa e área, além do histórico.</li>
                        <li><strong>Dica:</strong> Use "Imprimir / Salvar como PDF" para salvar o arquivo PDF usando a função de impressão do navegador.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
