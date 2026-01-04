import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../surveys/survey.entity';
import { Area } from '../areas/area.entity';
import { Employee } from '../employees/employee.entity';

interface SurveyField {
    key: string;
    label: string;
}

const SURVEY_FIELDS: SurveyField[] = [
    { key: 'interesseNoCargo', label: 'Interesse no Cargo' },
    { key: 'contribuicao', label: 'Contribuição' },
    { key: 'aprendizado', label: 'Aprendizado' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'interacaoGestor', label: 'Interação com Gestor' },
    { key: 'clarezaCarreira', label: 'Clareza de Carreira' },
    { key: 'expectativaPermanencia', label: 'Expectativa de Permanência' },
];

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
        @InjectRepository(Area)
        private areasRepository: Repository<Area>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
    ) { }

    async getCompanyStats() {
        const surveys = await this.surveysRepository.find();

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys),
        };
    }

    async getAreaStats() {
        const areas = await this.areasRepository.find();
        const result = [];

        for (const area of areas) {
            const stats = await this.getAreaStatsById(area.id);
            if (stats.total_surveys > 0) {
                result.push({
                    area: area,
                    stats: stats
                });
            }
        }

        return result;
    }

    async getAreaStatsById(areaId: number) {
        const surveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
            where: {
                employee: {
                    area: {
                        id: areaId
                    }
                }
            }
        });

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys)
        };
    }

    async getEmployeeStats(employeeId: number) {
        const surveys = await this.surveysRepository.find({
            where: { employee: { id: employeeId } }
        });

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys)
        };
    }

    async getEnpsStats() {
        const surveys = await this.surveysRepository.find();
        return this.calculateENPS(surveys);
    }

    private calculateENPS(surveys: Survey[]) {
        const validSurveys = surveys.filter(s => s.enps !== null && s.enps !== undefined);
        const total = validSurveys.length;

        if (total === 0) {
            return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
        }

        const promoters = validSurveys.filter(s => s.enps >= 9).length;
        const passives = validSurveys.filter(s => s.enps >= 7 && s.enps <= 8).length;
        const detractors = validSurveys.filter(s => s.enps <= 6).length;

        const score = ((promoters - detractors) / total) * 100;

        return {
            score: Number(score.toFixed(2)),
            promoters,
            passives,
            detractors,
            total
        };
    }

    private calculateFavorability(surveys: Survey[]) {
        let totalResponses = 0;
        let favorableResponses = 0;

        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia'
        ];

        surveys.forEach(survey => {
            fields.forEach(field => {
                const value = survey[field];
                if (value !== null && value !== undefined) {
                    totalResponses++;
                    if (value >= 4) {
                        favorableResponses++;
                    }
                }
            });
        });

        const score = totalResponses > 0 ? (favorableResponses / totalResponses) * 100 : 0;
        return Number(score.toFixed(2));
    }

    private calculateAverages(surveys: Survey[]) {
        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia'
        ];

        const sums = {};
        const counts = {};

        fields.forEach(f => {
            sums[f] = 0;
            counts[f] = 0;
        });

        surveys.forEach(survey => {
            fields.forEach(field => {
                const value = survey[field];
                if (value !== null && value !== undefined) {
                    sums[field] += value;
                    counts[field]++;
                }
            });
        });

        const averages = {};
        fields.forEach(field => {
            averages[field] = counts[field] > 0 ? Number((sums[field] / counts[field]).toFixed(2)) : 0;
        });

        return averages;
    }

    async getDistributionByDemographic(dimension: 'genero' | 'geracao' | 'tempoDeEmpresa') {
        const surveys = await this.surveysRepository.find({
            relations: ['employee'],
        });

        const groups: Record<string, Survey[]> = {};

        surveys.forEach(survey => {
            const value = survey.employee?.[dimension] || 'Não informado';
            if (!groups[value]) {
                groups[value] = [];
            }
            groups[value].push(survey);
        });

        const result = Object.entries(groups).map(([group, groupSurveys]) => ({
            group,
            count: groupSurveys.length,
            enps: this.calculateENPS(groupSurveys),
            favorability: this.calculateFavorability(groupSurveys),
            averages: this.calculateAverages(groupSurveys),
        }));

        return {
            dimension,
            total: surveys.length,
            distribution: result.sort((a, b) => b.count - a.count),
        };
    }

    async getResponseDistribution() {
        const surveys = await this.surveysRepository.find();

        const likertDistribution: Record<string, Record<number, number>> = {};
        const enpsDistribution: Record<number, number> = {};

        SURVEY_FIELDS.forEach(field => {
            likertDistribution[field.key] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        });

        for (let i = 0; i <= 10; i++) {
            enpsDistribution[i] = 0;
        }

        surveys.forEach(survey => {
            SURVEY_FIELDS.forEach(field => {
                const value = survey[field.key];
                if (value >= 1 && value <= 5) {
                    likertDistribution[field.key][value]++;
                }
            });

            if (survey.enps !== null && survey.enps >= 0 && survey.enps <= 10) {
                enpsDistribution[survey.enps]++;
            }
        });

        return {
            total: surveys.length,
            likert: Object.entries(likertDistribution).map(([key, dist]) => ({
                field: key,
                label: SURVEY_FIELDS.find(f => f.key === key)?.label || key,
                distribution: dist,
            })),
            enps: enpsDistribution,
        };
    }

    async getSummaryStatistics() {
        const surveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
        });

        const employees = await this.employeesRepository.find({
            relations: ['area'],
        });

        const areas = await this.areasRepository.find();

        const calculateStats = (values: number[]) => {
            if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };

            const sorted = [...values].sort((a, b) => a - b);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const median = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            return {
                mean: Number(mean.toFixed(2)),
                median: Number(median.toFixed(2)),
                min,
                max,
                stdDev: Number(stdDev.toFixed(2)),
            };
        };

        const fieldStats = {};
        SURVEY_FIELDS.forEach(field => {
            const values = surveys.map(s => s[field.key]).filter(v => v !== null && v !== undefined);
            fieldStats[field.key] = {
                label: field.label,
                ...calculateStats(values),
                count: values.length,
            };
        });

        const enpsValues = surveys.map(s => s.enps).filter(v => v !== null && v !== undefined);

        return {
            overview: {
                totalEmployees: employees.length,
                totalSurveys: surveys.length,
                totalAreas: areas.length,
                responseRate: employees.length > 0
                    ? Number(((surveys.length / employees.length) * 100).toFixed(2))
                    : 0,
            },
            enpsStats: {
                ...calculateStats(enpsValues),
                count: enpsValues.length,
            },
            likertStats: fieldStats,
            demographics: {
                byGender: this.groupCount(employees, 'genero'),
                byGeneration: this.groupCount(employees, 'geracao'),
                byTenure: this.groupCount(employees, 'tempoDeEmpresa'),
            },
        };
    }

    async getAreaComparison() {
        const areaStats = await this.getAreaStats();

        return areaStats.map(item => ({
            areaId: item.area.id,
            areaName: item.area.n4Area || item.area.n3Coordenacao || item.area.n2Gerencia || item.area.n1Diretoria || item.area.n0Empresa,
            hierarchy: {
                empresa: item.area.n0Empresa,
                diretoria: item.area.n1Diretoria,
                gerencia: item.area.n2Gerencia,
                coordenacao: item.area.n3Coordenacao,
                area: item.area.n4Area,
            },
            totalSurveys: item.stats.total_surveys,
            enpsScore: item.stats.enps.score,
            favorability: item.stats.favorability,
            averages: item.stats.averages,
        })).sort((a, b) => b.enpsScore - a.enpsScore);
    }

    async getCorrelationMatrix() {
        const surveys = await this.surveysRepository.find();

        const fields = [...SURVEY_FIELDS.map(f => f.key), 'enps'];
        const correlations: Record<string, Record<string, number>> = {};

        const getValues = (field: string): number[] => {
            return surveys.map(s => s[field]).filter(v => v !== null && v !== undefined);
        };

        const calculateCorrelation = (x: number[], y: number[]): number => {
            const n = Math.min(x.length, y.length);
            if (n === 0) return 0;

            const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
            const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
            const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
            const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

            return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(3));
        };

        fields.forEach(fieldX => {
            correlations[fieldX] = {};
            const xValues = getValues(fieldX);

            fields.forEach(fieldY => {
                const yValues = getValues(fieldY);
                correlations[fieldX][fieldY] = calculateCorrelation(xValues, yValues);
            });
        });

        return {
            fields: fields.map(f => ({
                key: f,
                label: SURVEY_FIELDS.find(sf => sf.key === f)?.label || 'eNPS',
            })),
            matrix: correlations,
        };
    }

    async getEmployeeComparison(employeeId: number) {
        const employee = await this.employeesRepository.findOne({
            where: { id: employeeId },
            relations: ['area'],
        });

        if (!employee) {
            return null;
        }

        const employeeStats = await this.getEmployeeStats(employeeId);
        const companyStats = await this.getCompanyStats();
        const areaStats = employee.area
            ? await this.getAreaStatsById(employee.area.id)
            : null;

        return {
            employee: {
                id: employee.id,
                nome: employee.nome,
                email: employee.email,
                cargo: employee.cargo,
                funcao: employee.funcao,
                localidade: employee.localidade,
                tempoDeEmpresa: employee.tempoDeEmpresa,
                genero: employee.genero,
                geracao: employee.geracao,
                area: employee.area,
            },
            stats: employeeStats,
            comparison: {
                company: {
                    enps: companyStats.enps,
                    favorability: companyStats.favorability,
                    averages: companyStats.averages,
                },
                area: areaStats ? {
                    enps: areaStats.enps,
                    favorability: areaStats.favorability,
                    averages: areaStats.averages,
                } : null,
            },
        };
    }

    async getEmployeesWithStats(page: number = 1, limit: number = 20, search?: string) {
        let queryBuilder = this.employeesRepository.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.area', 'area');

        if (search) {
            queryBuilder = queryBuilder.where(
                'LOWER(employee.nome) LIKE LOWER(:search) OR LOWER(employee.email) LIKE LOWER(:search) OR LOWER(employee.cargo) LIKE LOWER(:search)',
                { search: `%${search}%` }
            );
        }

        const total = await queryBuilder.getCount();
        const employees = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        const employeesWithStats = await Promise.all(
            employees.map(async (employee) => {
                const surveys = await this.surveysRepository.find({
                    where: { employee: { id: employee.id } },
                });

                const enps = this.calculateENPS(surveys);
                const favorability = this.calculateFavorability(surveys);

                return {
                    id: employee.id,
                    nome: employee.nome,
                    email: employee.email,
                    cargo: employee.cargo,
                    funcao: employee.funcao,
                    localidade: employee.localidade,
                    tempoDeEmpresa: employee.tempoDeEmpresa,
                    genero: employee.genero,
                    geracao: employee.geracao,
                    area: employee.area ? {
                        id: employee.area.id,
                        name: employee.area.n4Area || employee.area.n3Coordenacao || employee.area.n2Gerencia,
                    } : null,
                    totalSurveys: surveys.length,
                    enpsScore: enps.score,
                    favorability,
                };
            })
        );

        return {
            data: employeesWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private groupCount(items: any[], field: string): Record<string, number> {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            const value = item[field] || 'Não informado';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }
}
