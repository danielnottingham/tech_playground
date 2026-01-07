import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { NotFoundException } from '@nestjs/common';

describe('ReportsController', () => {
    let controller: ReportsController;
    let service: ReportsService;

    const mockCompanyReport = {
        generatedAt: new Date().toISOString(),
        overview: { totalEmployees: 10, totalSurveys: 50, totalAreas: 5, responseRate: 100 },
        enps: { score: 50, promoters: 30, passives: 15, detractors: 5, total: 50 },
        favorability: 75,
        averages: {},
        demographics: { byGender: {}, byGeneration: {}, byTenure: {} },
        topAreas: [],
        bottomAreas: [],
    };

    const mockAreaReport = {
        generatedAt: new Date().toISOString(),
        area: { id: 1, name: 'Area 1', hierarchy: {} },
        stats: { totalSurveys: 10, enps: { score: 50 }, favorability: 70, averages: {} },
        comparison: { companyEnps: 45, companyFavorability: 72, enpsDifference: 5, favorabilityDifference: -2 },
        employees: [],
    };

    const mockEmployeeReport = {
        generatedAt: new Date().toISOString(),
        employee: { id: 1, nome: 'John Doe', email: 'john@example.com' },
        stats: { totalSurveys: 2, enps: { score: 100 }, favorability: 90, averages: {} },
        comparison: { company: {}, area: {} },
        surveys: [],
    };

    const mockHtml = '<!DOCTYPE html><html><body>Report</body></html>';

    const mockReportsService = {
        generateCompanyReport: jest.fn().mockResolvedValue(mockCompanyReport),
        generateAreaReport: jest.fn().mockResolvedValue(mockAreaReport),
        generateEmployeeReport: jest.fn().mockResolvedValue(mockEmployeeReport),
        generateCompanyReportHtml: jest.fn().mockReturnValue(mockHtml),
        generateAreaReportHtml: jest.fn().mockReturnValue(mockHtml),
        generateEmployeeReportHtml: jest.fn().mockReturnValue(mockHtml),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [
                {
                    provide: ReportsService,
                    useValue: mockReportsService,
                },
            ],
        }).compile();

        controller = module.get<ReportsController>(ReportsController);
        service = module.get<ReportsService>(ReportsService);

        jest.clearAllMocks();
    });

    describe('Company Reports', () => {
        it('should return company report as JSON by default', async () => {
            const result = await controller.getCompanyReport();
            expect(result).toEqual(mockCompanyReport);
            expect(service.generateCompanyReport).toHaveBeenCalled();
        });

        it('should return company report with HTML when format=html', async () => {
            const result = await controller.getCompanyReport('html');
            expect(result).toHaveProperty('html');
            expect(result).toHaveProperty('data');
            expect(service.generateCompanyReportHtml).toHaveBeenCalled();
        });
    });

    describe('Area Reports', () => {
        it('should return area report as JSON by default', async () => {
            const result = await controller.getAreaReport('1');
            expect(result).toEqual(mockAreaReport);
            expect(service.generateAreaReport).toHaveBeenCalledWith(1);
        });

        it('should return area report with HTML when format=html', async () => {
            const result = await controller.getAreaReport('1', 'html');
            expect(result).toHaveProperty('html');
            expect(result).toHaveProperty('data');
        });

        it('should throw NotFoundException for non-existent area', async () => {
            mockReportsService.generateAreaReport.mockResolvedValueOnce(null);

            await expect(controller.getAreaReport('999')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('Employee Reports', () => {
        it('should return employee report as JSON by default', async () => {
            const result = await controller.getEmployeeReport('1');
            expect(result).toEqual(mockEmployeeReport);
            expect(service.generateEmployeeReport).toHaveBeenCalledWith(1);
        });

        it('should return employee report with HTML when format=html', async () => {
            const result = await controller.getEmployeeReport('1', 'html');
            expect(result).toHaveProperty('html');
            expect(result).toHaveProperty('data');
        });

        it('should throw NotFoundException for non-existent employee', async () => {
            mockReportsService.generateEmployeeReport.mockResolvedValueOnce(null);

            await expect(controller.getEmployeeReport('999')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
