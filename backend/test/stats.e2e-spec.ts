import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { StatsService } from './../src/stats/stats.service';

describe('StatsController (e2e)', () => {
    let app: INestApplication;
    let statsService: StatsService;

    const mockStats = {
        total_surveys: 10,
        enps: { score: 50 },
        favorability: 75,
        averages: {}
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(StatsService)
            .useValue({
                getCompanyStats: jest.fn().mockResolvedValue(mockStats),
                getAreaStats: jest.fn().mockResolvedValue([mockStats]),
                getAreaStatsById: jest.fn().mockResolvedValue(mockStats),
                getEmployeeStats: jest.fn().mockResolvedValue(mockStats),
                getEnpsStats: jest.fn().mockResolvedValue({ score: 50 }),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        statsService = moduleFixture.get<StatsService>(StatsService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('/stats/company (GET)', () => {
        return request(app.getHttpServer())
            .get('/stats/company')
            .expect(200)
            .expect(mockStats);
    });

    it('/stats/areas (GET)', () => {
        return request(app.getHttpServer())
            .get('/stats/areas')
            .expect(200);
    });
});
