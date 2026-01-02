import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AreasService } from './../src/areas/areas.service';

describe('AreasController (e2e)', () => {
    let app: INestApplication;
    let areasService: AreasService;

    const mockArea = {
        id: 1,
        n0Empresa: 'empresa',
        n1Diretoria: 'diretoria a',
        n2Gerencia: 'gerência a1',
        n3Coordenacao: 'coordenação a11',
        n4Area: 'área a112',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AreasService)
            .useValue({
                findAll: jest.fn().mockResolvedValue([mockArea]),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        areasService = moduleFixture.get<AreasService>(AreasService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/areas (GET)', () => {
        it('should return an array of areas', () => {
            return request(app.getHttpServer())
                .get('/areas')
                .expect(200)
                .expect([mockArea]);
        });
    });
});
