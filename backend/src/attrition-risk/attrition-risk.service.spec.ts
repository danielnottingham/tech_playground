import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttritionRiskService, RiskLevel } from './attrition-risk.service';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { SentimentService } from '../sentiment/sentiment.service';

describe('AttritionRiskService', () => {
    let service: AttritionRiskService;

    const highRiskEmployee = {
        id: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        cargo: 'Analista',
        funcao: 'Profissional',
        localidade: 'São Paulo',
        tempoDeEmpresa: '< 1 ano',
        genero: 'Masculino',
        geracao: 'Geração Y',
        area: { id: 1, n4Area: 'Tecnologia', n3Coordenacao: null, n2Gerencia: null, n1Diretoria: 'Diretoria A', n0Empresa: 'Empresa' },
    };

    const lowRiskEmployee = {
        id: 2,
        nome: 'Maria Santos',
        email: 'maria@example.com',
        cargo: 'Gerente',
        funcao: 'Gestor',
        localidade: 'Rio de Janeiro',
        tempoDeEmpresa: '5+ anos',
        genero: 'Feminino',
        geracao: 'Geração X',
        area: { id: 2, n4Area: 'Marketing', n3Coordenacao: null, n2Gerencia: null, n1Diretoria: 'Diretoria B', n0Empresa: 'Empresa' },
    };

    const highRiskSurvey = {
        id: 1,
        enps: 3,
        interesseNoCargo: 2,
        contribuicao: 2,
        aprendizado: 2,
        feedback: 1,
        interacaoGestor: 1,
        clarezaCarreira: 1,
        expectativaPermanencia: 1,
        employee: highRiskEmployee,
    };

    const lowRiskSurvey = {
        id: 2,
        enps: 10,
        interesseNoCargo: 5,
        contribuicao: 5,
        aprendizado: 5,
        feedback: 5,
        interacaoGestor: 5,
        clarezaCarreira: 5,
        expectativaPermanencia: 5,
        employee: lowRiskEmployee,
    };

    const mockEmployeeRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockSurveyRepository = {
        find: jest.fn(),
    };

    const mockSentimentService = {
        getEmployeeSentiment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttritionRiskService,
                { provide: getRepositoryToken(Survey), useValue: mockSurveyRepository },
                { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepository },
                { provide: SentimentService, useValue: mockSentimentService },
            ],
        }).compile();

        service = module.get<AttritionRiskService>(AttritionRiskService);

        jest.clearAllMocks();
    });

    describe('calculateEmployeeRisk', () => {
        it('should return null for non-existent employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(null);

            const result = await service.calculateEmployeeRisk(999);

            expect(result).toBeNull();
        });

        it('should return null for employee without surveys', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(highRiskEmployee);
            mockSurveyRepository.find.mockResolvedValue([]);

            const result = await service.calculateEmployeeRisk(1);

            expect(result).toBeNull();
        });

        it('should calculate high risk score for employee with low survey scores', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(highRiskEmployee);
            mockSurveyRepository.find.mockResolvedValue([highRiskSurvey]);
            mockSentimentService.getEmployeeSentiment.mockResolvedValue({
                employeeId: 1,
                comments: [],
                averageSentiment: -0.5,
                distribution: { positive: 0, neutral: 0, negative: 1 },
            });

            const result = await service.calculateEmployeeRisk(1);

            expect(result).not.toBeNull();
            expect(result!.riskScore).toBeGreaterThan(60);
            expect(['critical', 'high']).toContain(result!.riskLevel);
            expect(result!.employeeId).toBe(1);
            expect(result!.employeeName).toBe('João Silva');
            expect(result!.factors.length).toBeGreaterThan(0);
            expect(result!.recommendations.length).toBeGreaterThan(0);
        });

        it('should calculate low risk score for employee with high survey scores', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(lowRiskEmployee);
            mockSurveyRepository.find.mockResolvedValue([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment.mockResolvedValue({
                employeeId: 2,
                comments: [],
                averageSentiment: 0.8,
                distribution: { positive: 1, neutral: 0, negative: 0 },
            });

            const result = await service.calculateEmployeeRisk(2);

            expect(result).not.toBeNull();
            expect(result!.riskScore).toBeLessThan(30);
            expect(result!.riskLevel).toBe('low');
            expect(result!.employeeId).toBe(2);
        });

        it('should include all risk factors in the assessment', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(highRiskEmployee);
            mockSurveyRepository.find.mockResolvedValue([highRiskSurvey]);
            mockSentimentService.getEmployeeSentiment.mockResolvedValue({
                employeeId: 1,
                comments: [],
                averageSentiment: 0,
                distribution: { positive: 0, neutral: 1, negative: 0 },
            });

            const result = await service.calculateEmployeeRisk(1);

            expect(result!.factors).toHaveLength(8);
            const factorNames = result!.factors.map(f => f.factor);
            expect(factorNames).toContain('permanenceExpectation');
            expect(factorNames).toContain('enpsScore');
            expect(factorNames).toContain('careerClarity');
            expect(factorNames).toContain('managerInteraction');
            expect(factorNames).toContain('sentimentScore');
            expect(factorNames).toContain('feedback');
            expect(factorNames).toContain('learningOpportunities');
            expect(factorNames).toContain('contribution');
        });

        it('should generate recommendations for high risk employees', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(highRiskEmployee);
            mockSurveyRepository.find.mockResolvedValue([highRiskSurvey]);
            mockSentimentService.getEmployeeSentiment.mockResolvedValue({
                employeeId: 1,
                comments: [],
                averageSentiment: -0.5,
                distribution: { positive: 0, neutral: 0, negative: 1 },
            });

            const result = await service.calculateEmployeeRisk(1);

            expect(result!.recommendations.length).toBeGreaterThan(0);
            expect(result!.recommendations.some(r => r.includes('URGENTE') || r.includes('Priorizar'))).toBe(true);
        });
    });

    describe('getAttritionRiskSummary', () => {
        it('should return correct summary statistics', async () => {
            mockEmployeeRepository.find.mockResolvedValue([highRiskEmployee, lowRiskEmployee]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValueOnce({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: -0.5,
                    distribution: { positive: 0, neutral: 0, negative: 1 },
                })
                .mockResolvedValueOnce({
                    employeeId: 2,
                    comments: [],
                    averageSentiment: 0.8,
                    distribution: { positive: 1, neutral: 0, negative: 0 },
                });

            const summary = await service.getAttritionRiskSummary();

            expect(summary.totalEmployees).toBe(2);
            expect(summary.assessedEmployees).toBe(2);
            expect(summary.riskDistribution).toBeDefined();
            expect(summary.topRiskFactors.length).toBeGreaterThan(0);
            expect(summary.riskByDemographic).toBeDefined();
        });
    });

    describe('getAllEmployeesRisk', () => {
        it('should return paginated results', async () => {
            mockEmployeeRepository.find.mockResolvedValue([highRiskEmployee, lowRiskEmployee]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValueOnce({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: -0.5,
                    distribution: { positive: 0, neutral: 0, negative: 1 },
                })
                .mockResolvedValueOnce({
                    employeeId: 2,
                    comments: [],
                    averageSentiment: 0.8,
                    distribution: { positive: 1, neutral: 0, negative: 0 },
                });

            const result = await service.getAllEmployeesRisk(1, 10, 'riskScore');

            expect(result.data.length).toBe(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.total).toBe(2);
        });

        it('should filter by risk level', async () => {
            mockEmployeeRepository.find.mockResolvedValue([highRiskEmployee, lowRiskEmployee]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValueOnce({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: -0.5,
                    distribution: { positive: 0, neutral: 0, negative: 1 },
                })
                .mockResolvedValueOnce({
                    employeeId: 2,
                    comments: [],
                    averageSentiment: 0.8,
                    distribution: { positive: 1, neutral: 0, negative: 0 },
                });

            const result = await service.getAllEmployeesRisk(1, 10, 'riskScore', 'low' as RiskLevel);

            expect(result.data.every(e => e.riskLevel === 'low')).toBe(true);
        });
    });

    describe('getHighRiskEmployees', () => {
        it('should return only high and critical risk employees', async () => {
            mockEmployeeRepository.find.mockResolvedValue([highRiskEmployee, lowRiskEmployee]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValueOnce({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: -0.5,
                    distribution: { positive: 0, neutral: 0, negative: 1 },
                })
                .mockResolvedValueOnce({
                    employeeId: 2,
                    comments: [],
                    averageSentiment: 0.8,
                    distribution: { positive: 1, neutral: 0, negative: 0 },
                });

            const result = await service.getHighRiskEmployees(10);

            result.forEach(emp => {
                expect(['critical', 'high']).toContain(emp.riskLevel);
            });
        });
    });

    describe('analyzeCareerClarityImpact', () => {
        it('should analyze career clarity correlation with risk', async () => {
            mockSurveyRepository.find.mockResolvedValue([
                { ...highRiskSurvey, clarezaCarreira: 1 },
                { ...lowRiskSurvey, clarezaCarreira: 5 },
            ]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValue({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: 0,
                    distribution: { positive: 0, neutral: 1, negative: 0 },
                });

            const result = await service.analyzeCareerClarityImpact();

            expect(result.hypothesis).toBeDefined();
            expect(result.findings).toBeDefined();
            expect(result.findings.correlation).toBeDefined();
            expect(result.findings.conclusion).toBeDefined();
        });
    });

    describe('analyzeTenurePattern', () => {
        it('should analyze tenure patterns in risk', async () => {
            mockEmployeeRepository.find.mockResolvedValue([highRiskEmployee, lowRiskEmployee]);
            mockEmployeeRepository.findOne
                .mockResolvedValueOnce(highRiskEmployee)
                .mockResolvedValueOnce(lowRiskEmployee);
            mockSurveyRepository.find
                .mockResolvedValueOnce([highRiskSurvey])
                .mockResolvedValueOnce([lowRiskSurvey]);
            mockSentimentService.getEmployeeSentiment
                .mockResolvedValue({
                    employeeId: 1,
                    comments: [],
                    averageSentiment: 0,
                    distribution: { positive: 0, neutral: 1, negative: 0 },
                });

            const result = await service.analyzeTenurePattern();

            expect(result.hypothesis).toBeDefined();
            expect(result.findings).toBeDefined();
            expect(result.findings.highestRiskTenure).toBeDefined();
            expect(result.findings.lowestRiskTenure).toBeDefined();
            expect(result.details.length).toBeGreaterThan(0);
        });
    });

    describe('risk level classification', () => {
        const testCases = [
            { score: 75, expected: 'critical' },
            { score: 70, expected: 'critical' },
            { score: 55, expected: 'high' },
            { score: 50, expected: 'high' },
            { score: 35, expected: 'moderate' },
            { score: 30, expected: 'moderate' },
            { score: 25, expected: 'low' },
            { score: 10, expected: 'low' },
        ];

        testCases.forEach(({ score, expected }) => {
            it(`should classify score ${score} as ${expected}`, () => {
                const riskLevel = (service as any).getRiskLevel(score);
                expect(riskLevel).toBe(expected);
            });
        });
    });
});
