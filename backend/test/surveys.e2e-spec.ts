import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SurveysService } from './../src/surveys/surveys.service';

describe('SurveysController (e2e)', () => {
    let app: INestApplication;
    let surveysService: SurveysService;

    const mockSurvey = {
        id: 1,
        enps: 9,
        dataResposta: '2023-01-01',
        employee: { id: 1 },
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(SurveysService)
            .useValue({
                findAll: jest.fn().mockResolvedValue([mockSurvey]),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        surveysService = moduleFixture.get<SurveysService>(SurveysService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/surveys (GET)', () => {
        it('should return an array of surveys', () => {
            return request(app.getHttpServer())
                .get('/surveys')
                .expect(200)
                .expect([mockSurvey]);
        });

        it('should accept pagination parameters', () => {
            return request(app.getHttpServer())
                .get('/surveys?page=1&limit=5')
                .expect(200);
        });
    });
});
