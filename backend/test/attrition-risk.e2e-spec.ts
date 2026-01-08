import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AttritionRiskService } from './../src/attrition-risk/attrition-risk.service';

describe('AttritionRiskController (e2e)', () => {
    let app: INestApplication;
    let attritionRiskService: AttritionRiskService;

    const mockSummary = {
        totalEmployees: 100,
        assessedEmployees: 95,
        averageRiskScore: 35.5,
        riskDistribution: {
            critical: 5,
            high: 15,
            moderate: 35,
            low: 40,
        },
        topRiskFactors: [
            { factor: 'permanenceExpectation', label: 'Expectativa de Permanência', avgContribution: 0.15, affectedCount: 50 },
            { factor: 'careerClarity', label: 'Clareza de Carreira', avgContribution: 0.12, affectedCount: 45 },
        ],
        riskByDemographic: {
            byGeneration: { 'Geração Y': { count: 50, avgRisk: 38 }, 'Geração X': { count: 30, avgRisk: 32 } },
            byTenure: { '< 1 ano': { count: 20, avgRisk: 45 }, '5+ anos': { count: 30, avgRisk: 28 } },
            byArea: { 'Tecnologia': { count: 25, avgRisk: 36 } },
        },
    };

    const mockEmployeeRisk = {
        employeeId: 1,
        employeeName: 'João Silva',
        email: 'joao@example.com',
        area: 'Tecnologia',
        cargo: 'Analista',
        riskScore: 65,
        riskLevel: 'high',
        factors: [
            { factor: 'permanenceExpectation', label: 'Expectativa de Permanência', value: 0.8, weight: 0.25, contribution: 0.2, description: 'Baixa intenção de permanência' },
        ],
        recommendations: ['Agendar conversa 1:1', 'Criar plano de desenvolvimento'],
    };

    const mockCareerClarityAnalysis = {
        hypothesis: 'Funcionários com baixa clareza sobre possibilidades de carreira têm maior risco de atrito.',
        findings: {
            lowClarityAvgRisk: 55.5,
            highClarityAvgRisk: 28.3,
            correlation: -0.45,
            conclusion: 'Hipótese confirmada: Funcionários com baixa clareza de carreira apresentam risco de atrito significativamente maior.',
        },
        details: [
            { clarityScore: 1, count: 10, avgRiskScore: 60 },
            { clarityScore: 5, count: 30, avgRiskScore: 25 },
        ],
    };

    const mockTenurePattern = {
        hypothesis: 'O tempo de empresa afeta o padrão de risco de atrito.',
        findings: {
            highestRiskTenure: '< 1 ano',
            lowestRiskTenure: '5+ anos',
            pattern: 'Funcionários com tempo de empresa "< 1 ano" apresentam risco 15% maior que aqueles com "5+ anos".',
        },
        details: [
            { tenure: '< 1 ano', count: 20, avgRiskScore: 45, distribution: { critical: 2, high: 5, moderate: 8, low: 5 } },
            { tenure: '5+ anos', count: 30, avgRiskScore: 28, distribution: { critical: 0, high: 3, moderate: 10, low: 17 } },
        ],
    };

    const mockEmployeesRisk = {
        data: [mockEmployeeRisk],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AttritionRiskService)
            .useValue({
                getAttritionRiskSummary: jest.fn().mockResolvedValue(mockSummary),
                getAllEmployeesRisk: jest.fn().mockResolvedValue(mockEmployeesRisk),
                getHighRiskEmployees: jest.fn().mockResolvedValue([mockEmployeeRisk]),
                calculateEmployeeRisk: jest.fn().mockResolvedValue(mockEmployeeRisk),
                analyzeCareerClarityImpact: jest.fn().mockResolvedValue(mockCareerClarityAnalysis),
                analyzeTenurePattern: jest.fn().mockResolvedValue(mockTenurePattern),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        attritionRiskService = moduleFixture.get<AttritionRiskService>(AttritionRiskService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/attrition-risk/summary (GET)', () => {
        it('should return attrition risk summary', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/summary')
                .expect(200)
                .expect(mockSummary);
        });
    });

    describe('/attrition-risk/employees (GET)', () => {
        it('should return paginated employees with risk assessment', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/employees')
                .expect(200)
                .expect(mockEmployeesRisk);
        });

        it('should accept pagination parameters', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/employees?page=1&limit=10')
                .expect(200);
        });

        it('should accept sortBy parameter', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/employees?sortBy=riskScore')
                .expect(200);
        });

        it('should accept riskLevel filter', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/employees?riskLevel=high')
                .expect(200);
        });
    });

    describe('/attrition-risk/high-risk (GET)', () => {
        it('should return high risk employees', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/high-risk')
                .expect(200)
                .expect([mockEmployeeRisk]);
        });

        it('should accept limit parameter', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/high-risk?limit=5')
                .expect(200);
        });
    });

    describe('/attrition-risk/employees/:id (GET)', () => {
        it('should return risk assessment for specific employee', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/employees/1')
                .expect(200)
                .expect(mockEmployeeRisk);
        });
    });

    describe('/attrition-risk/analysis/career-clarity (GET)', () => {
        it('should return career clarity impact analysis', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/analysis/career-clarity')
                .expect(200)
                .expect(mockCareerClarityAnalysis);
        });
    });

    describe('/attrition-risk/analysis/tenure-pattern (GET)', () => {
        it('should return tenure pattern analysis', () => {
            return request(app.getHttpServer())
                .get('/attrition-risk/analysis/tenure-pattern')
                .expect(200)
                .expect(mockTenurePattern);
        });
    });
});
