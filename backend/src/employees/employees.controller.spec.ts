import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

describe('EmployeesController', () => {
    let controller: EmployeesController;
    let service: EmployeesService;

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

    const mockEmployeesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmployeesController],
            providers: [
                {
                    provide: EmployeesService,
                    useValue: mockEmployeesService,
                },
            ],
        }).compile();

        controller = module.get<EmployeesController>(EmployeesController);
        service = module.get<EmployeesService>(EmployeesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of employees', async () => {
            mockEmployeesService.findAll.mockResolvedValue([mockEmployee]);

            const result = await controller.findAll(1, 10);

            expect(result).toEqual([mockEmployee]);
            expect(service.findAll).toHaveBeenCalledWith(1, 10);
        });

        it('should handle pagination parameters', async () => {
            mockEmployeesService.findAll.mockResolvedValue([mockEmployee]);

            await controller.findAll(2, 5);

            expect(service.findAll).toHaveBeenCalledWith(2, 5);
        });
    });

    describe('findOne', () => {
        it('should return a single employee', async () => {
            mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

            const result = await controller.findOne('1');

            expect(result).toEqual(mockEmployee);
            expect(service.findOne).toHaveBeenCalledWith(1);
        });

        it('should convert string id to number', async () => {
            mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

            await controller.findOne('123');

            expect(service.findOne).toHaveBeenCalledWith(123);
        });
    });
});
