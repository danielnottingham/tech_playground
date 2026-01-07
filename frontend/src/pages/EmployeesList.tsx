import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface EmployeeWithStats {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    funcao: string;
    localidade: string;
    tempoDeEmpresa: string;
    genero: string;
    geracao: string;
    area: { id: number; name: string } | null;
    totalSurveys: number;
    enpsScore: number;
    favorability: number;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface EmployeesResponse {
    data: EmployeeWithStats[];
    pagination: PaginationData;
}

const getEnpsColor = (score: number): string => {
    if (score >= 50) return 'bg-green-100 text-green-700';
    if (score >= 0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
};

const getFavorabilityColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
};

export const EmployeesList: FC = () => {
    const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: '15',
                });
                if (debouncedSearch) {
                    params.append('search', debouncedSearch);
                }

                const response = await api.get<EmployeesResponse>(`/stats/employees-list?${params}`);
                setEmployees(response.data.data);
                setPagination(response.data.pagination);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setError('Falha ao carregar colaboradores. Verifique se o backend está em execução.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [currentPage, debouncedSearch]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-100">
                    <p className="text-red-500 text-lg">{error}</p>
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Colaboradores</h1>
                    <p className="text-gray-500 mt-2">Visualize métricas individuais e desempenho nas pesquisas</p>
                </header>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou cargo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {pagination && (
                            <div className="text-sm text-gray-500">
                                Exibindo {employees.length} de {pagination.total} colaboradores
                            </div>
                        )}
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Carregando colaboradores...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Nenhum colaborador encontrado com os critérios de busca.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Colaborador</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cargo</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Área</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">Pesquisas</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">eNPS</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">Favorabilidade</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{employee.nome}</p>
                                                    <p className="text-xs text-gray-500">{employee.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-gray-900">{employee.cargo || '-'}</p>
                                                    <p className="text-xs text-gray-500">{employee.funcao || ''}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-gray-900">{employee.area?.name || '-'}</p>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {employee.totalSurveys}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {employee.totalSurveys > 0 ? (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnpsColor(employee.enpsScore)}`}>
                                                        {employee.enpsScore.toFixed(0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {employee.totalSurveys > 0 ? (
                                                    <span className={`font-medium ${getFavorabilityColor(employee.favorability)}`}>
                                                        {employee.favorability.toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Link
                                                    to={`/employees/${employee.id}`}
                                                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                                >
                                                    Ver Detalhes
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                Página {pagination.page} de {pagination.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                    let pageNum: number;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium ${currentPage === pageNum
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={currentPage === pagination.totalPages}
                                    className="px-3 py-1 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="mt-8 text-center text-sm text-gray-400">
                    <p>Clique em qualquer colaborador para ver sua análise detalhada</p>
                </footer>
            </div>
        </div>
    );
};
