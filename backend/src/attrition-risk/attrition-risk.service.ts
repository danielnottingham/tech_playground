import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { SentimentService } from '../sentiment/sentiment.service';

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';
export interface RiskFactor {
    factor: string;
    label: string;
    value: number;           // Raw value (0-1 normalized)
    weight: number;          // Weight in final score
    contribution: number;    // Weighted contribution to final score
    description: string;     // Human-readable description
}

export interface EmployeeRiskAssessment {
    employeeId: number;
    employeeName: string;
    email: string;
    area: string;
    cargo: string;
    riskScore: number;       // 0-100 scale
    riskLevel: RiskLevel;
    factors: RiskFactor[];
    recommendations: string[];
}

export interface AttritionRiskSummary {
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

const RISK_WEIGHTS = {
    permanenceExpectation: 0.25,
    enpsScore: 0.20,
    careerClarity: 0.15,
    managerInteraction: 0.12,
    sentimentScore: 0.10,
    feedback: 0.08,
    learningOpportunities: 0.05,
    contribution: 0.05,
};

@Injectable()
export class AttritionRiskService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
        private sentimentService: SentimentService,
    ) { }


    async calculateEmployeeRisk(employeeId: number): Promise<EmployeeRiskAssessment | null> {
        const employee = await this.employeesRepository.findOne({
            where: { id: employeeId },
            relations: ['area'],
        });

        if (!employee) {
            return null;
        }

        const surveys = await this.surveysRepository.find({
            where: { employee: { id: employeeId } },
        });

        if (surveys.length === 0) {
            return null;
        }

        const survey = surveys[0];

        const sentimentData = await this.sentimentService.getEmployeeSentiment(employeeId);

        const factors = this.calculateRiskFactors(survey, sentimentData.averageSentiment);
        const riskScore = factors.reduce((sum, f) => sum + f.contribution, 0) * 100;

        const riskLevel = this.getRiskLevel(riskScore);

        const recommendations = this.generateRecommendations(factors, riskLevel);

        return {
            employeeId: employee.id,
            employeeName: employee.nome,
            email: employee.email,
            area: employee.area?.n4Area || employee.area?.n3Coordenacao || employee.area?.n2Gerencia || 'N/A',
            cargo: employee.cargo,
            riskScore: Number(riskScore.toFixed(1)),
            riskLevel,
            factors,
            recommendations,
        };
    }

    async getAllEmployeesRisk(
        page: number = 1,
        limit: number = 20,
        sortBy: 'riskScore' | 'name' = 'riskScore',
        riskLevel?: RiskLevel,
    ): Promise<{
        data: EmployeeRiskAssessment[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const employees = await this.employeesRepository.find({
            relations: ['area'],
        });

        const assessments: EmployeeRiskAssessment[] = [];

        for (const employee of employees) {
            const assessment = await this.calculateEmployeeRisk(employee.id);
            if (assessment) {
                if (!riskLevel || assessment.riskLevel === riskLevel) {
                    assessments.push(assessment);
                }
            }
        }

        if (sortBy === 'riskScore') {
            assessments.sort((a, b) => b.riskScore - a.riskScore);
        } else {
            assessments.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        }

        const total = assessments.length;
        const startIndex = (page - 1) * limit;
        const paginatedData = assessments.slice(startIndex, startIndex + limit);

        return {
            data: paginatedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAttritionRiskSummary(): Promise<AttritionRiskSummary> {
        const employees = await this.employeesRepository.find({
            relations: ['area'],
        });

        const assessments: EmployeeRiskAssessment[] = [];
        const factorContributions: Record<string, number[]> = {};

        for (const employee of employees) {
            const assessment = await this.calculateEmployeeRisk(employee.id);
            if (assessment) {
                assessments.push(assessment);

                for (const factor of assessment.factors) {
                    if (!factorContributions[factor.factor]) {
                        factorContributions[factor.factor] = [];
                    }
                    factorContributions[factor.factor].push(factor.contribution);
                }
            }
        }

        const distribution = {
            critical: assessments.filter(a => a.riskLevel === 'critical').length,
            high: assessments.filter(a => a.riskLevel === 'high').length,
            moderate: assessments.filter(a => a.riskLevel === 'moderate').length,
            low: assessments.filter(a => a.riskLevel === 'low').length,
        };

        const avgRiskScore = assessments.length > 0
            ? assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length
            : 0;

        const topRiskFactors = Object.entries(factorContributions)
            .map(([factor, contributions]) => ({
                factor,
                label: this.getFactorLabel(factor),
                avgContribution: contributions.reduce((a, b) => a + b, 0) / contributions.length,
                affectedCount: contributions.filter(c => c > 0.1).length,
            }))
            .sort((a, b) => b.avgContribution - a.avgContribution);

        const riskByDemographic = this.calculateRiskByDemographic(assessments, employees);

        return {
            totalEmployees: employees.length,
            assessedEmployees: assessments.length,
            averageRiskScore: Number(avgRiskScore.toFixed(1)),
            riskDistribution: distribution,
            topRiskFactors,
            riskByDemographic,
        };
    }

    async getHighRiskEmployees(limit: number = 10): Promise<EmployeeRiskAssessment[]> {
        const result = await this.getAllEmployeesRisk(1, limit, 'riskScore');
        return result.data.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high');
    }

    async analyzeCareerClarityImpact(): Promise<{
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
    }> {
        const surveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
        });

        const groups: Record<number, { risks: number[]; clarity: number }> = {};

        for (const survey of surveys) {
            if (survey.clarezaCarreira) {
                const assessment = await this.calculateEmployeeRisk(survey.employee.id);
                if (assessment) {
                    if (!groups[survey.clarezaCarreira]) {
                        groups[survey.clarezaCarreira] = { risks: [], clarity: survey.clarezaCarreira };
                    }
                    groups[survey.clarezaCarreira].risks.push(assessment.riskScore);
                }
            }
        }

        const details = Object.values(groups).map(g => ({
            clarityScore: g.clarity,
            count: g.risks.length,
            avgRiskScore: Number((g.risks.reduce((a, b) => a + b, 0) / g.risks.length).toFixed(1)),
        })).sort((a, b) => a.clarityScore - b.clarityScore);

        const lowClarity = details.filter(d => d.clarityScore <= 2);
        const highClarity = details.filter(d => d.clarityScore >= 4);

        const lowClarityAvgRisk = lowClarity.length > 0
            ? lowClarity.reduce((sum, d) => sum + d.avgRiskScore * d.count, 0) / lowClarity.reduce((sum, d) => sum + d.count, 0)
            : 0;

        const highClarityAvgRisk = highClarity.length > 0
            ? highClarity.reduce((sum, d) => sum + d.avgRiskScore * d.count, 0) / highClarity.reduce((sum, d) => sum + d.count, 0)
            : 0;

        const clarityValues = details.map(d => d.clarityScore);
        const riskValues = details.map(d => d.avgRiskScore);
        const correlation = this.calculateCorrelation(clarityValues, riskValues);

        const conclusion = correlation < -0.3
            ? 'Hipótese confirmada: Funcionários com baixa clareza de carreira apresentam risco de atrito significativamente maior.'
            : correlation < 0
                ? 'Hipótese parcialmente confirmada: Existe uma correlação negativa fraca entre clareza de carreira e risco de atrito.'
                : 'Hipótese não confirmada: Não foi encontrada correlação significativa entre clareza de carreira e risco de atrito.';

        return {
            hypothesis: 'Funcionários com baixa clareza sobre possibilidades de carreira têm maior risco de atrito.',
            findings: {
                lowClarityAvgRisk: Number(lowClarityAvgRisk.toFixed(1)),
                highClarityAvgRisk: Number(highClarityAvgRisk.toFixed(1)),
                correlation: Number(correlation.toFixed(3)),
                conclusion,
            },
            details,
        };
    }

    async analyzeTenurePattern(): Promise<{
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
    }> {
        const employees = await this.employeesRepository.find({
            relations: ['area'],
        });

        const tenureGroups: Record<string, EmployeeRiskAssessment[]> = {};

        for (const employee of employees) {
            const assessment = await this.calculateEmployeeRisk(employee.id);
            if (assessment) {
                const tenure = employee.tempoDeEmpresa || 'Não informado';
                if (!tenureGroups[tenure]) {
                    tenureGroups[tenure] = [];
                }
                tenureGroups[tenure].push(assessment);
            }
        }

        const details = Object.entries(tenureGroups).map(([tenure, assessments]) => ({
            tenure,
            count: assessments.length,
            avgRiskScore: Number((assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length).toFixed(1)),
            distribution: {
                critical: assessments.filter(a => a.riskLevel === 'critical').length,
                high: assessments.filter(a => a.riskLevel === 'high').length,
                moderate: assessments.filter(a => a.riskLevel === 'moderate').length,
                low: assessments.filter(a => a.riskLevel === 'low').length,
            },
        })).sort((a, b) => b.avgRiskScore - a.avgRiskScore);

        const highestRiskTenure = details[0]?.tenure || 'N/A';
        const lowestRiskTenure = details[details.length - 1]?.tenure || 'N/A';

        let pattern = 'Nenhum padrão claro identificado.';
        const riskDiff = details[0]?.avgRiskScore - details[details.length - 1]?.avgRiskScore;
        if (riskDiff > 15) {
            pattern = `Funcionários com tempo de empresa "${highestRiskTenure}" apresentam risco ${riskDiff.toFixed(0)}% maior que aqueles com "${lowestRiskTenure}".`;
        }

        return {
            hypothesis: 'O tempo de empresa afeta o padrão de risco de atrito.',
            findings: {
                highestRiskTenure,
                lowestRiskTenure,
                pattern,
            },
            details,
        };
    }

    private calculateRiskFactors(survey: Survey, sentimentScore: number): RiskFactor[] {
        const factors: RiskFactor[] = [];

        const permanenceRisk = survey.expectativaPermanencia
            ? (6 - survey.expectativaPermanencia) / 5
            : 0.5;
        factors.push({
            factor: 'permanenceExpectation',
            label: 'Expectativa de Permanência',
            value: permanenceRisk,
            weight: RISK_WEIGHTS.permanenceExpectation,
            contribution: permanenceRisk * RISK_WEIGHTS.permanenceExpectation,
            description: this.getPermanenceDescription(survey.expectativaPermanencia),
        });

        const enpsRisk = survey.enps !== null && survey.enps !== undefined
            ? (10 - survey.enps) / 10
            : 0.5;
        factors.push({
            factor: 'enpsScore',
            label: 'Score eNPS',
            value: enpsRisk,
            weight: RISK_WEIGHTS.enpsScore,
            contribution: enpsRisk * RISK_WEIGHTS.enpsScore,
            description: this.getEnpsDescription(survey.enps),
        });

        const careerRisk = survey.clarezaCarreira
            ? (6 - survey.clarezaCarreira) / 5
            : 0.5;
        factors.push({
            factor: 'careerClarity',
            label: 'Clareza de Carreira',
            value: careerRisk,
            weight: RISK_WEIGHTS.careerClarity,
            contribution: careerRisk * RISK_WEIGHTS.careerClarity,
            description: this.getCareerClarityDescription(survey.clarezaCarreira),
        });

        const managerRisk = survey.interacaoGestor
            ? (6 - survey.interacaoGestor) / 5
            : 0.5;
        factors.push({
            factor: 'managerInteraction',
            label: 'Interação com Gestor',
            value: managerRisk,
            weight: RISK_WEIGHTS.managerInteraction,
            contribution: managerRisk * RISK_WEIGHTS.managerInteraction,
            description: this.getManagerDescription(survey.interacaoGestor),
        });

        const sentimentRisk = (1 - sentimentScore) / 2;
        factors.push({
            factor: 'sentimentScore',
            label: 'Sentimento dos Comentários',
            value: sentimentRisk,
            weight: RISK_WEIGHTS.sentimentScore,
            contribution: sentimentRisk * RISK_WEIGHTS.sentimentScore,
            description: this.getSentimentDescription(sentimentScore),
        });

        const feedbackRisk = survey.feedback
            ? (6 - survey.feedback) / 5
            : 0.5;
        factors.push({
            factor: 'feedback',
            label: 'Feedback',
            value: feedbackRisk,
            weight: RISK_WEIGHTS.feedback,
            contribution: feedbackRisk * RISK_WEIGHTS.feedback,
            description: this.getFeedbackDescription(survey.feedback),
        });

        const learningRisk = survey.aprendizado
            ? (6 - survey.aprendizado) / 5
            : 0.5;
        factors.push({
            factor: 'learningOpportunities',
            label: 'Oportunidades de Aprendizado',
            value: learningRisk,
            weight: RISK_WEIGHTS.learningOpportunities,
            contribution: learningRisk * RISK_WEIGHTS.learningOpportunities,
            description: this.getLearningDescription(survey.aprendizado),
        });

        const contributionRisk = survey.contribuicao
            ? (6 - survey.contribuicao) / 5
            : 0.5;
        factors.push({
            factor: 'contribution',
            label: 'Senso de Contribuição',
            value: contributionRisk,
            weight: RISK_WEIGHTS.contribution,
            contribution: contributionRisk * RISK_WEIGHTS.contribution,
            description: this.getContributionDescription(survey.contribuicao),
        });

        return factors.sort((a, b) => b.contribution - a.contribution);
    }

    private getRiskLevel(score: number): RiskLevel {
        if (score >= 70) return 'critical';
        if (score >= 50) return 'high';
        if (score >= 30) return 'moderate';
        return 'low';
    }

    private generateRecommendations(factors: RiskFactor[], riskLevel: RiskLevel): string[] {
        const recommendations: string[] = [];
        const topFactors = factors.slice(0, 3);

        for (const factor of topFactors) {
            if (factor.contribution > 0.1) {
                switch (factor.factor) {
                    case 'permanenceExpectation':
                        recommendations.push('Agendar conversa 1:1 para entender expectativas de permanência e planos futuros.');
                        break;
                    case 'enpsScore':
                        recommendations.push('Investigar motivos de insatisfação geral e trabalhar em melhorias específicas.');
                        break;
                    case 'careerClarity':
                        recommendations.push('Criar plano de desenvolvimento individual com metas claras de carreira.');
                        break;
                    case 'managerInteraction':
                        recommendations.push('Melhorar frequência e qualidade de feedback do gestor.');
                        break;
                    case 'sentimentScore':
                        recommendations.push('Analisar comentários negativos e abordar preocupações específicas.');
                        break;
                    case 'feedback':
                        recommendations.push('Estabelecer cadência regular de feedback construtivo.');
                        break;
                    case 'learningOpportunities':
                        recommendations.push('Oferecer oportunidades de treinamento e desenvolvimento.');
                        break;
                    case 'contribution':
                        recommendations.push('Reforçar a importância das contribuições do colaborador para a equipe.');
                        break;
                }
            }
        }

        if (riskLevel === 'critical') {
            recommendations.unshift('URGENTE: Agendar reunião imediata com RH e liderança para plano de retenção.');
        } else if (riskLevel === 'high') {
            recommendations.unshift('Priorizar ação preventiva para evitar perda do colaborador.');
        }

        return recommendations;
    }

    private calculateRiskByDemographic(
        assessments: EmployeeRiskAssessment[],
        employees: Employee[],
    ): AttritionRiskSummary['riskByDemographic'] {
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        const groupByField = (field: keyof Employee) => {
            const groups: Record<string, { count: number; totalRisk: number }> = {};

            for (const assessment of assessments) {
                const employee = employeeMap.get(assessment.employeeId);
                const value = (employee?.[field] as string) || 'Não informado';

                if (!groups[value]) {
                    groups[value] = { count: 0, totalRisk: 0 };
                }
                groups[value].count++;
                groups[value].totalRisk += assessment.riskScore;
            }

            const result: Record<string, { count: number; avgRisk: number }> = {};
            for (const [key, data] of Object.entries(groups)) {
                result[key] = {
                    count: data.count,
                    avgRisk: Number((data.totalRisk / data.count).toFixed(1)),
                };
            }
            return result;
        };

        const byArea: Record<string, { count: number; totalRisk: number }> = {};
        for (const assessment of assessments) {
            const area = assessment.area || 'Não informado';
            if (!byArea[area]) {
                byArea[area] = { count: 0, totalRisk: 0 };
            }
            byArea[area].count++;
            byArea[area].totalRisk += assessment.riskScore;
        }

        const areaResult: Record<string, { count: number; avgRisk: number }> = {};
        for (const [key, data] of Object.entries(byArea)) {
            areaResult[key] = {
                count: data.count,
                avgRisk: Number((data.totalRisk / data.count).toFixed(1)),
            };
        }

        return {
            byGeneration: groupByField('geracao'),
            byTenure: groupByField('tempoDeEmpresa'),
            byArea: areaResult,
        };
    }

    private calculateCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        if (n === 0) return 0;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private getFactorLabel(factor: string): string {
        const labels: Record<string, string> = {
            permanenceExpectation: 'Expectativa de Permanência',
            enpsScore: 'Score eNPS',
            careerClarity: 'Clareza de Carreira',
            managerInteraction: 'Interação com Gestor',
            sentimentScore: 'Sentimento dos Comentários',
            feedback: 'Feedback',
            learningOpportunities: 'Oportunidades de Aprendizado',
            contribution: 'Senso de Contribuição',
        };
        return labels[factor] || factor;
    }

    private getPermanenceDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Alta intenção de permanência';
        if (score >= 3) return 'Intenção moderada de permanência';
        return 'Baixa intenção de permanência - Atenção necessária';
    }

    private getEnpsDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 9) return 'Promotor - Muito satisfeito';
        if (score >= 7) return 'Passivo - Satisfeito';
        return 'Detrator - Insatisfeito - Atenção necessária';
    }

    private getCareerClarityDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Boa clareza sobre carreira';
        if (score >= 3) return 'Clareza moderada sobre carreira';
        return 'Pouca clareza sobre carreira - Atenção necessária';
    }

    private getManagerDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Boa interação com gestor';
        if (score >= 3) return 'Interação moderada com gestor';
        return 'Interação fraca com gestor - Atenção necessária';
    }

    private getSentimentDescription(score: number): string {
        if (score > 0.3) return 'Comentários predominantemente positivos';
        if (score > -0.3) return 'Comentários neutros';
        return 'Comentários predominantemente negativos - Atenção necessária';
    }

    private getFeedbackDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Feedback adequado recebido';
        if (score >= 3) return 'Feedback parcialmente adequado';
        return 'Feedback insuficiente - Atenção necessária';
    }

    private getLearningDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Boas oportunidades de aprendizado';
        if (score >= 3) return 'Oportunidades moderadas de aprendizado';
        return 'Poucas oportunidades de aprendizado - Atenção necessária';
    }

    private getContributionDescription(score: number | null): string {
        if (score === null) return 'Não respondido';
        if (score >= 4) return 'Alto senso de contribuição';
        if (score >= 3) return 'Senso moderado de contribuição';
        return 'Baixo senso de contribuição - Atenção necessária';
    }
}
