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

export interface CompanyReportData {
    generatedAt: string;
    overview: {
        totalEmployees: number;
        totalSurveys: number;
        totalAreas: number;
        responseRate: number;
    };
    enps: {
        score: number;
        promoters: number;
        passives: number;
        detractors: number;
        total: number;
        promotersPercent: number;
        passivesPercent: number;
        detractorsPercent: number;
    };
    favorability: number;
    averages: Record<string, number>;
    demographics: {
        byGender: Record<string, number>;
        byGeneration: Record<string, number>;
        byTenure: Record<string, number>;
    };
    topAreas: {
        areaId: number;
        areaName: string;
        enpsScore: number;
        favorability: number;
        totalSurveys: number;
    }[];
    bottomAreas: {
        areaId: number;
        areaName: string;
        enpsScore: number;
        favorability: number;
        totalSurveys: number;
    }[];
}

export interface AreaReportData {
    generatedAt: string;
    area: {
        id: number;
        name: string;
        hierarchy: {
            empresa: string;
            diretoria: string;
            gerencia: string;
            coordenacao: string;
            area: string;
        };
    };
    stats: {
        totalSurveys: number;
        enps: {
            score: number;
            promoters: number;
            passives: number;
            detractors: number;
            total: number;
            promotersPercent: number;
            passivesPercent: number;
            detractorsPercent: number;
        };
        favorability: number;
        averages: Record<string, number>;
    };
    comparison: {
        companyEnps: number;
        companyFavorability: number;
        enpsDifference: number;
        favorabilityDifference: number;
    };
    employees: {
        id: number;
        nome: string;
        cargo: string;
        enpsScore: number;
        favorability: number;
    }[];
}

export interface EmployeeReportData {
    generatedAt: string;
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
        area: {
            id: number;
            name: string;
        } | null;
    };
    stats: {
        totalSurveys: number;
        enps: {
            score: number;
            promoters: number;
            passives: number;
            detractors: number;
            total: number;
        };
        favorability: number;
        averages: Record<string, number>;
    };
    comparison: {
        company: {
            enps: number;
            favorability: number;
            averages: Record<string, number>;
        };
        area: {
            enps: number;
            favorability: number;
            averages: Record<string, number>;
        } | null;
    };
    surveys: {
        id: number;
        dataResposta: string;
        enps: number;
        scores: Record<string, number>;
    }[];
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
        @InjectRepository(Area)
        private areasRepository: Repository<Area>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
    ) {}

    async generateCompanyReport(): Promise<CompanyReportData> {
        const surveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
        });
        const employees = await this.employeesRepository.find({
            relations: ['area'],
        });
        const areas = await this.areasRepository.find();

        const enpsData = this.calculateENPS(surveys);
        const favorability = this.calculateFavorability(surveys);
        const averages = this.calculateAverages(surveys);

        // Calculate area stats for ranking
        const areaStats = await this.calculateAllAreaStats(areas, surveys);
        const sortedByEnps = [...areaStats].sort((a, b) => b.enpsScore - a.enpsScore);

        return {
            generatedAt: new Date().toISOString(),
            overview: {
                totalEmployees: employees.length,
                totalSurveys: surveys.length,
                totalAreas: areas.length,
                responseRate: employees.length > 0
                    ? Number(((surveys.length / employees.length) * 100).toFixed(2))
                    : 0,
            },
            enps: {
                ...enpsData,
                promotersPercent: enpsData.total > 0 ? Number(((enpsData.promoters / enpsData.total) * 100).toFixed(1)) : 0,
                passivesPercent: enpsData.total > 0 ? Number(((enpsData.passives / enpsData.total) * 100).toFixed(1)) : 0,
                detractorsPercent: enpsData.total > 0 ? Number(((enpsData.detractors / enpsData.total) * 100).toFixed(1)) : 0,
            },
            favorability,
            averages,
            demographics: {
                byGender: this.groupCount(employees, 'genero'),
                byGeneration: this.groupCount(employees, 'geracao'),
                byTenure: this.groupCount(employees, 'tempoDeEmpresa'),
            },
            topAreas: sortedByEnps.slice(0, 5),
            bottomAreas: sortedByEnps.slice(-5).reverse(),
        };
    }

    async generateAreaReport(areaId: number): Promise<AreaReportData | null> {
        const area = await this.areasRepository.findOne({ where: { id: areaId } });
        if (!area) return null;

        const areaSurveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
            where: { employee: { area: { id: areaId } } },
        });

        const allSurveys = await this.surveysRepository.find();

        const areaEnps = this.calculateENPS(areaSurveys);
        const areaFavorability = this.calculateFavorability(areaSurveys);
        const companyEnps = this.calculateENPS(allSurveys);
        const companyFavorability = this.calculateFavorability(allSurveys);

        // Get employees in this area with their stats
        const employees = await this.employeesRepository.find({
            where: { area: { id: areaId } },
            relations: ['area'],
        });

        const employeesWithStats = await Promise.all(
            employees.map(async (emp) => {
                const empSurveys = await this.surveysRepository.find({
                    where: { employee: { id: emp.id } },
                });
                const empEnps = this.calculateENPS(empSurveys);
                const empFavorability = this.calculateFavorability(empSurveys);
                return {
                    id: emp.id,
                    nome: emp.nome,
                    cargo: emp.cargo,
                    enpsScore: empEnps.score,
                    favorability: empFavorability,
                };
            })
        );

        const areaName = area.n4Area || area.n3Coordenacao || area.n2Gerencia || area.n1Diretoria || area.n0Empresa;

        return {
            generatedAt: new Date().toISOString(),
            area: {
                id: area.id,
                name: areaName,
                hierarchy: {
                    empresa: area.n0Empresa,
                    diretoria: area.n1Diretoria,
                    gerencia: area.n2Gerencia,
                    coordenacao: area.n3Coordenacao,
                    area: area.n4Area,
                },
            },
            stats: {
                totalSurveys: areaSurveys.length,
                enps: {
                    ...areaEnps,
                    promotersPercent: areaEnps.total > 0 ? Number(((areaEnps.promoters / areaEnps.total) * 100).toFixed(1)) : 0,
                    passivesPercent: areaEnps.total > 0 ? Number(((areaEnps.passives / areaEnps.total) * 100).toFixed(1)) : 0,
                    detractorsPercent: areaEnps.total > 0 ? Number(((areaEnps.detractors / areaEnps.total) * 100).toFixed(1)) : 0,
                },
                favorability: areaFavorability,
                averages: this.calculateAverages(areaSurveys),
            },
            comparison: {
                companyEnps: companyEnps.score,
                companyFavorability,
                enpsDifference: Number((areaEnps.score - companyEnps.score).toFixed(2)),
                favorabilityDifference: Number((areaFavorability - companyFavorability).toFixed(2)),
            },
            employees: employeesWithStats.sort((a, b) => b.enpsScore - a.enpsScore),
        };
    }

    async generateEmployeeReport(employeeId: number): Promise<EmployeeReportData | null> {
        const employee = await this.employeesRepository.findOne({
            where: { id: employeeId },
            relations: ['area'],
        });
        if (!employee) return null;

        const employeeSurveys = await this.surveysRepository.find({
            where: { employee: { id: employeeId } },
            order: { dataResposta: 'DESC' },
        });

        const allSurveys = await this.surveysRepository.find();
        const areaSurveys = employee.area
            ? await this.surveysRepository.find({
                  where: { employee: { area: { id: employee.area.id } } },
              })
            : [];

        const empEnps = this.calculateENPS(employeeSurveys);
        const empFavorability = this.calculateFavorability(employeeSurveys);
        const empAverages = this.calculateAverages(employeeSurveys);

        const companyEnps = this.calculateENPS(allSurveys);
        const companyFavorability = this.calculateFavorability(allSurveys);
        const companyAverages = this.calculateAverages(allSurveys);

        const areaEnps = areaSurveys.length > 0 ? this.calculateENPS(areaSurveys) : null;
        const areaFavorability = areaSurveys.length > 0 ? this.calculateFavorability(areaSurveys) : null;
        const areaAverages = areaSurveys.length > 0 ? this.calculateAverages(areaSurveys) : null;

        const areaName = employee.area
            ? employee.area.n4Area || employee.area.n3Coordenacao || employee.area.n2Gerencia
            : null;

        return {
            generatedAt: new Date().toISOString(),
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
                area: employee.area
                    ? { id: employee.area.id, name: areaName }
                    : null,
            },
            stats: {
                totalSurveys: employeeSurveys.length,
                enps: empEnps,
                favorability: empFavorability,
                averages: empAverages,
            },
            comparison: {
                company: {
                    enps: companyEnps.score,
                    favorability: companyFavorability,
                    averages: companyAverages,
                },
                area: areaEnps
                    ? {
                          enps: areaEnps.score,
                          favorability: areaFavorability,
                          averages: areaAverages,
                      }
                    : null,
            },
            surveys: employeeSurveys.map((s) => ({
                id: s.id,
                dataResposta: s.dataResposta,
                enps: s.enps,
                scores: {
                    interesseNoCargo: s.interesseNoCargo,
                    contribuicao: s.contribuicao,
                    aprendizado: s.aprendizado,
                    feedback: s.feedback,
                    interacaoGestor: s.interacaoGestor,
                    clarezaCarreira: s.clarezaCarreira,
                    expectativaPermanencia: s.expectativaPermanencia,
                },
            })),
        };
    }

    generateCompanyReportHtml(data: CompanyReportData): string {
        const enpsColor = this.getEnpsColor(data.enps.score);
        const favColor = this.getFavorabilityColor(data.favorability);

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório da Empresa - Pesquisa de Satisfação</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .report-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .report-header h1 { font-size: 2rem; margin-bottom: 10px; }
        .report-header .date { opacity: 0.9; font-size: 0.9rem; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .card h2 { color: #4a5568; font-size: 1.25rem; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px; }
        .metric-value { font-size: 2.5rem; font-weight: bold; }
        .metric-label { color: #718096; font-size: 0.875rem; margin-top: 5px; }
        .enps-breakdown { display: flex; justify-content: space-around; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .enps-item { text-align: center; }
        .enps-item .count { font-size: 1.5rem; font-weight: bold; }
        .enps-item .percent { font-size: 0.875rem; color: #718096; }
        .enps-item.promoters .count { color: #48bb78; }
        .enps-item.passives .count { color: #ecc94b; }
        .enps-item.detractors .count { color: #f56565; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { background: #f7fafc; font-weight: 600; color: #4a5568; }
        .table tr:hover { background: #f7fafc; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #fefcbf; color: #744210; }
        .badge-danger { background: #fed7d7; color: #742a2a; }
        .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; border-radius: 4px; }
        .demographics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .demo-section h3 { font-size: 1rem; color: #4a5568; margin-bottom: 12px; }
        .demo-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        @media print { body { background: white; } .container { max-width: 100%; } .card { box-shadow: none; border: 1px solid #e2e8f0; break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="report-header">
            <h1>Relatório Geral da Empresa</h1>
            <p class="date">Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
        </div>

        <div class="card">
            <h2>Visão Geral</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value">${data.overview.totalEmployees}</div>
                    <div class="metric-label">Total de Funcionários</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.overview.totalSurveys}</div>
                    <div class="metric-label">Total de Pesquisas</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.overview.totalAreas}</div>
                    <div class="metric-label">Total de Áreas</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.overview.responseRate}%</div>
                    <div class="metric-label">Taxa de Resposta</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>eNPS (Employee Net Promoter Score)</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value" style="color: ${enpsColor}">${data.enps.score}</div>
                    <div class="metric-label">Score eNPS</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: ${favColor}">${data.favorability}%</div>
                    <div class="metric-label">Favorabilidade</div>
                </div>
            </div>
            <div class="enps-breakdown">
                <div class="enps-item promoters">
                    <div class="count">${data.enps.promoters}</div>
                    <div class="percent">${data.enps.promotersPercent}%</div>
                    <div class="metric-label">Promotores (9-10)</div>
                </div>
                <div class="enps-item passives">
                    <div class="count">${data.enps.passives}</div>
                    <div class="percent">${data.enps.passivesPercent}%</div>
                    <div class="metric-label">Neutros (7-8)</div>
                </div>
                <div class="enps-item detractors">
                    <div class="count">${data.enps.detractors}</div>
                    <div class="percent">${data.enps.detractorsPercent}%</div>
                    <div class="metric-label">Detratores (0-6)</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Médias por Competência</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Competência</th>
                        <th>Média</th>
                        <th>Classificação</th>
                    </tr>
                </thead>
                <tbody>
                    ${SURVEY_FIELDS.map((field) => {
                        const avg = data.averages[field.key] || 0;
                        const badge = this.getAverageBadge(avg);
                        return `
                    <tr>
                        <td>${field.label}</td>
                        <td><strong>${avg.toFixed(2)}</strong> / 5.00</td>
                        <td><span class="badge ${badge.class}">${badge.label}</span></td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Top 5 Áreas (Maior eNPS)</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Área</th>
                        <th>eNPS</th>
                        <th>Favorabilidade</th>
                        <th>Pesquisas</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.topAreas.map((area) => `
                    <tr>
                        <td>${area.areaName}</td>
                        <td><strong style="color: ${this.getEnpsColor(area.enpsScore)}">${area.enpsScore}</strong></td>
                        <td>${area.favorability}%</td>
                        <td>${area.totalSurveys}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>5 Áreas com Menor eNPS</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Área</th>
                        <th>eNPS</th>
                        <th>Favorabilidade</th>
                        <th>Pesquisas</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.bottomAreas.map((area) => `
                    <tr>
                        <td>${area.areaName}</td>
                        <td><strong style="color: ${this.getEnpsColor(area.enpsScore)}">${area.enpsScore}</strong></td>
                        <td>${area.favorability}%</td>
                        <td>${area.totalSurveys}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Demografia</h2>
            <div class="demographics-grid">
                <div class="demo-section">
                    <h3>Por Gênero</h3>
                    ${Object.entries(data.demographics.byGender).map(([key, value]) => `
                    <div class="demo-item">
                        <span>${key}</span>
                        <strong>${value}</strong>
                    </div>`).join('')}
                </div>
                <div class="demo-section">
                    <h3>Por Geração</h3>
                    ${Object.entries(data.demographics.byGeneration).map(([key, value]) => `
                    <div class="demo-item">
                        <span>${key}</span>
                        <strong>${value}</strong>
                    </div>`).join('')}
                </div>
                <div class="demo-section">
                    <h3>Por Tempo de Empresa</h3>
                    ${Object.entries(data.demographics.byTenure).map(([key, value]) => `
                    <div class="demo-item">
                        <span>${key}</span>
                        <strong>${value}</strong>
                    </div>`).join('')}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    generateAreaReportHtml(data: AreaReportData): string {
        const enpsColor = this.getEnpsColor(data.stats.enps.score);
        const favColor = this.getFavorabilityColor(data.stats.favorability);
        const enpsDiffColor = data.comparison.enpsDifference >= 0 ? '#48bb78' : '#f56565';
        const favDiffColor = data.comparison.favorabilityDifference >= 0 ? '#48bb78' : '#f56565';

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório da Área - ${data.area.name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .report-header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .report-header h1 { font-size: 2rem; margin-bottom: 10px; }
        .report-header .subtitle { font-size: 1.1rem; opacity: 0.9; margin-bottom: 10px; }
        .report-header .date { opacity: 0.8; font-size: 0.9rem; }
        .hierarchy { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .card h2 { color: #4a5568; font-size: 1.25rem; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px; }
        .metric-value { font-size: 2.5rem; font-weight: bold; }
        .metric-label { color: #718096; font-size: 0.875rem; margin-top: 5px; }
        .metric-diff { font-size: 0.875rem; margin-top: 5px; }
        .enps-breakdown { display: flex; justify-content: space-around; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .enps-item { text-align: center; }
        .enps-item .count { font-size: 1.5rem; font-weight: bold; }
        .enps-item .percent { font-size: 0.875rem; color: #718096; }
        .enps-item.promoters .count { color: #48bb78; }
        .enps-item.passives .count { color: #ecc94b; }
        .enps-item.detractors .count { color: #f56565; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { background: #f7fafc; font-weight: 600; color: #4a5568; }
        .table tr:hover { background: #f7fafc; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #fefcbf; color: #744210; }
        .badge-danger { background: #fed7d7; color: #742a2a; }
        @media print { body { background: white; } .container { max-width: 100%; } .card { box-shadow: none; border: 1px solid #e2e8f0; break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="report-header">
            <h1>Relatório da Área</h1>
            <p class="subtitle">${data.area.name}</p>
            <p class="date">Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
            <div class="hierarchy">
                <strong>Hierarquia:</strong> ${data.area.hierarchy.empresa} > ${data.area.hierarchy.diretoria} > ${data.area.hierarchy.gerencia} > ${data.area.hierarchy.coordenacao} > ${data.area.hierarchy.area}
            </div>
        </div>

        <div class="card">
            <h2>Métricas Principais</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value" style="color: ${enpsColor}">${data.stats.enps.score}</div>
                    <div class="metric-label">eNPS da Área</div>
                    <div class="metric-diff" style="color: ${enpsDiffColor}">
                        ${data.comparison.enpsDifference >= 0 ? '+' : ''}${data.comparison.enpsDifference} vs empresa
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: ${favColor}">${data.stats.favorability}%</div>
                    <div class="metric-label">Favorabilidade</div>
                    <div class="metric-diff" style="color: ${favDiffColor}">
                        ${data.comparison.favorabilityDifference >= 0 ? '+' : ''}${data.comparison.favorabilityDifference}% vs empresa
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.stats.totalSurveys}</div>
                    <div class="metric-label">Total de Pesquisas</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.employees.length}</div>
                    <div class="metric-label">Funcionários</div>
                </div>
            </div>
            <div class="enps-breakdown">
                <div class="enps-item promoters">
                    <div class="count">${data.stats.enps.promoters}</div>
                    <div class="percent">${data.stats.enps.promotersPercent}%</div>
                    <div class="metric-label">Promotores</div>
                </div>
                <div class="enps-item passives">
                    <div class="count">${data.stats.enps.passives}</div>
                    <div class="percent">${data.stats.enps.passivesPercent}%</div>
                    <div class="metric-label">Neutros</div>
                </div>
                <div class="enps-item detractors">
                    <div class="count">${data.stats.enps.detractors}</div>
                    <div class="percent">${data.stats.enps.detractorsPercent}%</div>
                    <div class="metric-label">Detratores</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Médias por Competência</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Competência</th>
                        <th>Média da Área</th>
                        <th>Classificação</th>
                    </tr>
                </thead>
                <tbody>
                    ${SURVEY_FIELDS.map((field) => {
                        const avg = data.stats.averages[field.key] || 0;
                        const badge = this.getAverageBadge(avg);
                        return `
                    <tr>
                        <td>${field.label}</td>
                        <td><strong>${avg.toFixed(2)}</strong> / 5.00</td>
                        <td><span class="badge ${badge.class}">${badge.label}</span></td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Funcionários da Área</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Cargo</th>
                        <th>eNPS</th>
                        <th>Favorabilidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.employees.map((emp) => `
                    <tr>
                        <td>${emp.nome}</td>
                        <td>${emp.cargo || '-'}</td>
                        <td><strong style="color: ${this.getEnpsColor(emp.enpsScore)}">${emp.enpsScore}</strong></td>
                        <td>${emp.favorability}%</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
    }

    generateEmployeeReportHtml(data: EmployeeReportData): string {
        const enpsColor = this.getEnpsColor(data.stats.enps.score);
        const favColor = this.getFavorabilityColor(data.stats.favorability);

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Individual - ${data.employee.nome}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .report-header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .report-header h1 { font-size: 2rem; margin-bottom: 5px; }
        .report-header .subtitle { font-size: 1.1rem; opacity: 0.9; }
        .report-header .date { opacity: 0.8; font-size: 0.9rem; margin-top: 15px; }
        .profile-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem; }
        .profile-item { display: flex; flex-direction: column; }
        .profile-item label { opacity: 0.8; font-size: 0.8rem; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .card h2 { color: #4a5568; font-size: 1.25rem; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px; }
        .metric-value { font-size: 2rem; font-weight: bold; }
        .metric-label { color: #718096; font-size: 0.875rem; margin-top: 5px; }
        .comparison-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
        .comparison-item { text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px; }
        .comparison-item .label { font-size: 0.75rem; color: #718096; margin-bottom: 5px; }
        .comparison-item .value { font-size: 1.25rem; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { background: #f7fafc; font-weight: 600; color: #4a5568; }
        .table tr:hover { background: #f7fafc; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #fefcbf; color: #744210; }
        .badge-danger { background: #fed7d7; color: #742a2a; }
        @media print { body { background: white; } .container { max-width: 100%; } .card { box-shadow: none; border: 1px solid #e2e8f0; break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="report-header">
            <h1>${data.employee.nome}</h1>
            <p class="subtitle">${data.employee.cargo || ''} ${data.employee.funcao ? `- ${data.employee.funcao}` : ''}</p>
            <p class="date">Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
            <div class="profile-info">
                <div class="profile-item">
                    <label>Email</label>
                    <span>${data.employee.email}</span>
                </div>
                <div class="profile-item">
                    <label>Área</label>
                    <span>${data.employee.area?.name || 'Não informado'}</span>
                </div>
                <div class="profile-item">
                    <label>Localidade</label>
                    <span>${data.employee.localidade || 'Não informado'}</span>
                </div>
                <div class="profile-item">
                    <label>Tempo de Empresa</label>
                    <span>${data.employee.tempoDeEmpresa || 'Não informado'}</span>
                </div>
                <div class="profile-item">
                    <label>Geração</label>
                    <span>${data.employee.geracao || 'Não informado'}</span>
                </div>
                <div class="profile-item">
                    <label>Gênero</label>
                    <span>${data.employee.genero || 'Não informado'}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Métricas Individuais</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value" style="color: ${enpsColor}">${data.stats.enps.score}</div>
                    <div class="metric-label">eNPS</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: ${favColor}">${data.stats.favorability}%</div>
                    <div class="metric-label">Favorabilidade</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.stats.totalSurveys}</div>
                    <div class="metric-label">Pesquisas Respondidas</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Comparação com Empresa${data.comparison.area ? ' e Área' : ''}</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Competência</th>
                        <th>Individual</th>
                        <th>Empresa</th>
                        ${data.comparison.area ? '<th>Área</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>eNPS</strong></td>
                        <td style="color: ${enpsColor}"><strong>${data.stats.enps.score}</strong></td>
                        <td>${data.comparison.company.enps}</td>
                        ${data.comparison.area ? `<td>${data.comparison.area.enps}</td>` : ''}
                    </tr>
                    <tr>
                        <td><strong>Favorabilidade</strong></td>
                        <td style="color: ${favColor}"><strong>${data.stats.favorability}%</strong></td>
                        <td>${data.comparison.company.favorability}%</td>
                        ${data.comparison.area ? `<td>${data.comparison.area.favorability}%</td>` : ''}
                    </tr>
                    ${SURVEY_FIELDS.map((field) => {
                        const indAvg = data.stats.averages[field.key] || 0;
                        const compAvg = data.comparison.company.averages[field.key] || 0;
                        const areaAvg = data.comparison.area?.averages[field.key] || 0;
                        return `
                    <tr>
                        <td>${field.label}</td>
                        <td><strong>${indAvg.toFixed(2)}</strong></td>
                        <td>${compAvg.toFixed(2)}</td>
                        ${data.comparison.area ? `<td>${areaAvg.toFixed(2)}</td>` : ''}
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${data.surveys.length > 0 ? `
        <div class="card">
            <h2>Histórico de Pesquisas</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>eNPS</th>
                        ${SURVEY_FIELDS.map((f) => `<th>${f.label.split(' ')[0]}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.surveys.map((survey) => `
                    <tr>
                        <td>${survey.dataResposta ? new Date(survey.dataResposta).toLocaleDateString('pt-BR') : '-'}</td>
                        <td><strong>${survey.enps ?? '-'}</strong></td>
                        ${SURVEY_FIELDS.map((f) => `<td>${survey.scores[f.key] ?? '-'}</td>`).join('')}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    private async calculateAllAreaStats(
        areas: Area[],
        allSurveys: Survey[],
    ): Promise<{ areaId: number; areaName: string; enpsScore: number; favorability: number; totalSurveys: number }[]> {
        const result = [];

        for (const area of areas) {
            const areaSurveys = allSurveys.filter(
                (s) => s.employee?.area?.id === area.id,
            );
            if (areaSurveys.length === 0) continue;

            const enps = this.calculateENPS(areaSurveys);
            const favorability = this.calculateFavorability(areaSurveys);
            const areaName = area.n4Area || area.n3Coordenacao || area.n2Gerencia || area.n1Diretoria || area.n0Empresa;

            result.push({
                areaId: area.id,
                areaName,
                enpsScore: enps.score,
                favorability,
                totalSurveys: areaSurveys.length,
            });
        }

        return result;
    }

    private calculateENPS(surveys: Survey[]) {
        const validSurveys = surveys.filter(
            (s) => s.enps !== null && s.enps !== undefined,
        );
        const total = validSurveys.length;

        if (total === 0) {
            return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
        }

        const promoters = validSurveys.filter((s) => s.enps >= 9).length;
        const passives = validSurveys.filter((s) => s.enps >= 7 && s.enps <= 8).length;
        const detractors = validSurveys.filter((s) => s.enps <= 6).length;

        const score = ((promoters - detractors) / total) * 100;

        return {
            score: Number(score.toFixed(2)),
            promoters,
            passives,
            detractors,
            total,
        };
    }

    private calculateFavorability(surveys: Survey[]): number {
        let totalResponses = 0;
        let favorableResponses = 0;

        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia',
        ];

        surveys.forEach((survey) => {
            fields.forEach((field) => {
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

    private calculateAverages(surveys: Survey[]): Record<string, number> {
        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia',
        ];

        const sums: Record<string, number> = {};
        const counts: Record<string, number> = {};

        fields.forEach((f) => {
            sums[f] = 0;
            counts[f] = 0;
        });

        surveys.forEach((survey) => {
            fields.forEach((field) => {
                const value = survey[field];
                if (value !== null && value !== undefined) {
                    sums[field] += value;
                    counts[field]++;
                }
            });
        });

        const averages: Record<string, number> = {};
        fields.forEach((field) => {
            averages[field] = counts[field] > 0 ? Number((sums[field] / counts[field]).toFixed(2)) : 0;
        });

        return averages;
    }

    private groupCount(items: any[], field: string): Record<string, number> {
        const counts: Record<string, number> = {};
        items.forEach((item) => {
            const value = item[field] || 'Não informado';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    private getEnpsColor(score: number): string {
        if (score >= 50) return '#48bb78';
        if (score >= 0) return '#ecc94b';
        return '#f56565';
    }

    private getFavorabilityColor(score: number): string {
        if (score >= 70) return '#48bb78';
        if (score >= 50) return '#ecc94b';
        return '#f56565';
    }

    private getAverageBadge(avg: number): { class: string; label: string } {
        if (avg >= 4) return { class: 'badge-success', label: 'Excelente' };
        if (avg >= 3) return { class: 'badge-warning', label: 'Regular' };
        return { class: 'badge-danger', label: 'Atenção' };
    }
}
