import { useEffect, useState, type FC } from 'react';
import { AreaCard } from '../components/AreaCard';
import api from '../services/api';

export const AreasList: FC = () => {
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await api.get('/stats/areas');
                setAreas(response.data);
            } catch (error) {
                console.error('Error fetching areas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAreas();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando áreas...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Visão Geral das Áreas</h1>
                    <p className="text-gray-500 mt-2">Métricas de desempenho por área</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map((item) => (
                        <AreaCard key={item.area.id} area={item.area} stats={item.stats} />
                    ))}
                </div>
            </div>
        </div>
    );
};
