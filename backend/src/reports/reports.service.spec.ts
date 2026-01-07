import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { Area } from '../areas/area.entity';

describe('ReportsService', () => {
    let service: ReportsService;
    let surveysRepository: Repository<Survey>;
    let employeesRepository: Repository<Employee>;
    let areasRepository: Repository<Area>;

    const mockArea = {
        id: 1,
        n0Empresa: 'Empresa',
        n1Diretoria: 'Diretoria',
        n2Gerencia: 'Gerencia',
        n3Coordenacao: 'Coordenacao',
        n4Area: 'Area de TI',
    };

    const mockEmployees = [
        {
            id: 1,
            nome: 'John Doe',
            email: 'john@example.com',
            cargo: 'Developer',
            funcao: 'Backend',
            localidade: 'São Paulo',
            tempoDeEmpresa: '1-3 anos',
            genero: 'Masculino',
            geracao: 'Millenial',
            area: mockArea,
        },
        {
            id: 2,
            nome: 'Jane Doe',
            email: 'jane@example.com',
            cargo: 'Designer',
            funcao: 'UX',
            localidade: 'Rio de Janeiro',
            tempoDeEmpresa: '3-5 anos',
            genero: 'Feminino',
            geracao: 'Gen Z',
            area: mockArea,
        },
    ];

    const mockSurveys = [
        {
            id: 1,
            enps: 10,
            interesseNoCargo: 5,
            contribuicao: 5,
            aprendizado: 5,
            feedback: 5,
            interacaoGestor: 5,
            clarezaCarreira: 5,
            expectativaPermanencia: 5,
            dataResposta: new Date('2024-01-15'),
            employee: mockEmployees[0],
        },
        {
            id: 2,
            enps: 8,
            interesseNoCargo: 4,
            contribuicao: 4,
            aprendizado: 3,
            feedback: 4,
            interacaoGestor: 4,
            clarezaCarreira: 3,
            expectativaPermanencia: 4,
            dataResposta: new Date('2024-01-16'),
            employee: mockEmployees[0],
        },
        {
            id: 3,
            enps: 5,
            interesseNoCargo: 2,
            contribuicao: 2,
            aprendizado: 2,
            feedback: 2,
            interacaoGestor: 2,
            clarezaCarreira: 2,
            expectativaPermanencia: 2,
            dataResposta: new Date('2024-01-17'),
            employee: mockEmployees[1],
        },
    ];

    const mockSurveyRepository = {
        find: jest.fn(),
    };

    const mockAreaRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockEmployeeRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                { provide: getRepositoryToken(Survey), useValue: mockSurveyRepository },
                { provide: getRepositoryToken(Area), useValue: mockAreaRepository },
                { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepository },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
        surveysRepository = module.get<Repository<Survey>>(getRepositoryToken(Survey));
        employeesRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
        areasRepository = module.get<Repository<Area>>(getRepositoryToken(Area));

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('generateCompanyReport', () => {
        beforeEach(() => {
            mockSurveyRepository.find.mockResolvedValue(mockSurveys);
            mockEmployeeRepository.find.mockResolvedValue(mockEmployees);
            mockAreaRepository.find.mockResolvedValue([mockArea]);
        });

        it('should generate company report with correct overview', async () => {
            const report = await service.generateCompanyReport();

            expect(report.overview.totalEmployees).toBe(2);
            expect(report.overview.totalSurveys).toBe(3);
            expect(report.overview.totalAreas).toBe(1);
            expect(report.overview.responseRate).toBe(150); // 3 surveys / 2 employees * 100
        });

        it('should calculate eNPS correctly', async () => {
            const report = await service.generateCompanyReport();

            // 1 promoter (score 10), 1 passive (score 8), 1 detractor (score 5)
            expect(report.enps.promoters).toBe(1);
            expect(report.enps.passives).toBe(1);
            expect(report.enps.detractors).toBe(1);
            expect(report.enps.total).toBe(3);
            // eNPS = (1 - 1) / 3 * 100 = 0
            expect(report.enps.score).toBe(0);
        });

        it('should calculate favorability correctly', async () => {
            const report = await service.generateCompanyReport();

            // Survey 1: 7 fields all 5 = 7 favorable
            // Survey 2: 5 fields >= 4, 2 fields = 3 = 5 favorable
            // Survey 3: 0 fields >= 4 = 0 favorable
            // Total: 21 responses, 12 favorable = 57.14%
            expect(report.favorability).toBe(57.14);
        });

        it('should include demographics breakdown', async () => {
            const report = await service.generateCompanyReport();

            expect(report.demographics.byGender).toEqual({
                Masculino: 1,
                Feminino: 1,
            });
            expect(report.demographics.byGeneration).toEqual({
                Millenial: 1,
                'Gen Z': 1,
            });
        });

        it('should include generatedAt timestamp', async () => {
            const report = await service.generateCompanyReport();

            expect(report.generatedAt).toBeDefined();
            expect(new Date(report.generatedAt).getTime()).not.toBeNaN();
        });
    });

    describe('generateAreaReport', () => {
        beforeEach(() => {
            mockAreaRepository.findOne.mockResolvedValue(mockArea);
            mockSurveyRepository.find.mockResolvedValue(mockSurveys);
            mockEmployeeRepository.find.mockResolvedValue(mockEmployees);
        });

        it('should return null for non-existent area', async () => {
            mockAreaRepository.findOne.mockResolvedValue(null);

            const report = await service.generateAreaReport(999);

            expect(report).toBeNull();
        });

        it('should generate area report with correct data', async () => {
            const report = await service.generateAreaReport(1);

            expect(report).not.toBeNull();
            expect(report.area.id).toBe(1);
            expect(report.area.name).toBe('Area de TI');
            expect(report.area.hierarchy.empresa).toBe('Empresa');
        });

        it('should include comparison with company metrics', async () => {
            const report = await service.generateAreaReport(1);

            expect(report.comparison).toBeDefined();
            expect(report.comparison.companyEnps).toBeDefined();
            expect(report.comparison.companyFavorability).toBeDefined();
            expect(report.comparison.enpsDifference).toBeDefined();
            expect(report.comparison.favorabilityDifference).toBeDefined();
        });

        it('should include employees list', async () => {
            const report = await service.generateAreaReport(1);

            expect(report.employees).toHaveLength(2);
            expect(report.employees[0]).toHaveProperty('nome');
            expect(report.employees[0]).toHaveProperty('enpsScore');
            expect(report.employees[0]).toHaveProperty('favorability');
        });
    });

    describe('generateEmployeeReport', () => {
        beforeEach(() => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployees[0]);
            mockSurveyRepository.find.mockImplementation((options: any) => {
                if (options?.where?.employee?.id === 1) {
                    return Promise.resolve([mockSurveys[0], mockSurveys[1]]);
                }
                return Promise.resolve(mockSurveys);
            });
        });

        it('should return null for non-existent employee', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(null);

            const report = await service.generateEmployeeReport(999);

            expect(report).toBeNull();
        });

        it('should generate employee report with correct data', async () => {
            const report = await service.generateEmployeeReport(1);

            expect(report).not.toBeNull();
            expect(report.employee.id).toBe(1);
            expect(report.employee.nome).toBe('John Doe');
            expect(report.employee.email).toBe('john@example.com');
        });

        it('should include employee stats', async () => {
            const report = await service.generateEmployeeReport(1);

            expect(report.stats).toBeDefined();
            expect(report.stats.totalSurveys).toBe(2);
            expect(report.stats.enps).toBeDefined();
            expect(report.stats.favorability).toBeDefined();
        });

        it('should include comparison with company and area', async () => {
            const report = await service.generateEmployeeReport(1);

            expect(report.comparison.company).toBeDefined();
            expect(report.comparison.company.enps).toBeDefined();
            expect(report.comparison.area).toBeDefined();
        });

        it('should include survey history', async () => {
            const report = await service.generateEmployeeReport(1);

            expect(report.surveys).toHaveLength(2);
            expect(report.surveys[0]).toHaveProperty('dataResposta');
            expect(report.surveys[0]).toHaveProperty('enps');
            expect(report.surveys[0]).toHaveProperty('scores');
        });
    });

    describe('HTML Generation', () => {
        beforeEach(() => {
            mockSurveyRepository.find.mockResolvedValue(mockSurveys);
            mockEmployeeRepository.find.mockResolvedValue(mockEmployees);
            mockAreaRepository.find.mockResolvedValue([mockArea]);
        });

        it('should generate valid HTML for company report', async () => {
            const data = await service.generateCompanyReport();
            const html = service.generateCompanyReportHtml(data);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Relatório Geral da Empresa');
            expect(html).toContain('eNPS');
            expect(html).toContain('Favorabilidade');
        });

        it('should generate valid HTML for area report', async () => {
            mockAreaRepository.findOne.mockResolvedValue(mockArea);
            const data = await service.generateAreaReport(1);
            const html = service.generateAreaReportHtml(data);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Relatório da Área');
            expect(html).toContain('Area de TI');
        });

        it('should generate valid HTML for employee report', async () => {
            mockEmployeeRepository.findOne.mockResolvedValue(mockEmployees[0]);
            const data = await service.generateEmployeeReport(1);
            const html = service.generateEmployeeReportHtml(data);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('John Doe');
            expect(html).toContain('Relatório Individual');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty surveys', async () => {
            mockSurveyRepository.find.mockResolvedValue([]);
            mockEmployeeRepository.find.mockResolvedValue([]);
            mockAreaRepository.find.mockResolvedValue([]);

            const report = await service.generateCompanyReport();

            expect(report.overview.totalSurveys).toBe(0);
            expect(report.enps.score).toBe(0);
            expect(report.favorability).toBe(0);
        });

        it('should handle surveys with null enps', async () => {
            const surveysWithNull = [
                { ...mockSurveys[0], enps: null },
                { ...mockSurveys[1] },
            ];
            mockSurveyRepository.find.mockResolvedValue(surveysWithNull);
            mockEmployeeRepository.find.mockResolvedValue(mockEmployees);
            mockAreaRepository.find.mockResolvedValue([mockArea]);

            const report = await service.generateCompanyReport();

            // Only 1 valid eNPS (score 8 = passive)
            expect(report.enps.total).toBe(1);
            expect(report.enps.passives).toBe(1);
        });

        it('should handle surveys with null field values', async () => {
            const surveysWithNull = [
                {
                    ...mockSurveys[0],
                    interesseNoCargo: null,
                    contribuicao: null,
                },
            ];
            mockSurveyRepository.find.mockResolvedValue(surveysWithNull);
            mockEmployeeRepository.find.mockResolvedValue(mockEmployees);
            mockAreaRepository.find.mockResolvedValue([mockArea]);

            const report = await service.generateCompanyReport();

            // Should not throw and should calculate with available values
            expect(report.favorability).toBeDefined();
        });
    });
});
