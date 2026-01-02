import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
    let controller: StatsController;
    let service: StatsService;

    const mockStats = {
        total_surveys: 10,
        enps: { score: 50 },
        favorability: 75,
        averages: {}
    };

    const mockStatsService = {
        getCompanyStats: jest.fn().mockResolvedValue(mockStats),
        getAreaStats: jest.fn().mockResolvedValue([mockStats]),
        getAreaStatsById: jest.fn().mockResolvedValue(mockStats),
        getEmployeeStats: jest.fn().mockResolvedValue(mockStats),
        getEnpsStats: jest.fn().mockResolvedValue({ score: 50 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StatsController],
            providers: [
                {
                    provide: StatsService,
                    useValue: mockStatsService,
                },
            ],
        }).compile();

        controller = module.get<StatsController>(StatsController);
        service = module.get<StatsService>(StatsService);
    });

    it('should return company stats', async () => {
        const result = await controller.getCompanyStats();
        expect(result).toEqual(mockStats);
        expect(service.getCompanyStats).toHaveBeenCalled();
    });

    it('should return area stats', async () => {
        const result = await controller.getAreaStats();
        expect(result).toEqual([mockStats]);
        expect(service.getAreaStats).toHaveBeenCalled();
    });
});
