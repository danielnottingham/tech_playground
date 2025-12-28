import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { EmployeesService } from './../src/employees/employees.service';

describe('EmployeesController (e2e)', () => {
    let app: INestApplication;
    let employeesService: EmployeesService;

    const mockEmployee = {
        id: 1,
        nome: 'Demo 001',
        email: 'demo001@pinpeople.com.br',
        emailCorporativo: 'demo001@pinpeople.com.br',
        celular: null,
        cargo: 'estagiário',
        funcao: 'profissional',
        localidade: 'brasília',
        tempoDeEmpresa: 'entre 1 e 2 anos',
        genero: 'masculino',
        geracao: 'geração z',
        area: {
            id: 1,
            n0Empresa: 'empresa',
            n1Diretoria: 'diretoria a',
            n2Gerencia: 'gerência a1',
            n3Coordenacao: 'coordenação a11',
            n4Area: 'área a112',
        },
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmployeesService)
            .useValue({
                findAll: jest.fn().mockResolvedValue([mockEmployee]),
                findOne: jest.fn().mockResolvedValue(mockEmployee),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        employeesService = moduleFixture.get<EmployeesService>(EmployeesService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/employees (GET)', () => {
        it('should return an array of employees', () => {
            return request(app.getHttpServer())
                .get('/employees')
                .expect(200)
                .expect([mockEmployee]);
        });

        it('should accept pagination parameters', () => {
            return request(app.getHttpServer())
                .get('/employees?page=1&limit=5')
                .expect(200);
        });
    });

    describe('/employees/:id (GET)', () => {
        it('should return a single employee', () => {
            return request(app.getHttpServer())
                .get('/employees/1')
                .expect(200)
                .expect(mockEmployee);
        });

        it('should return 404 for non-existent employee', async () => {
            jest.spyOn(employeesService, 'findOne').mockResolvedValueOnce(null);

            return request(app.getHttpServer())
                .get('/employees/999')
                .expect(404);
        });
    });
});
