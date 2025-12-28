import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';

describe('EmployeesService', () => {
    let service: EmployeesService;
    let repository: Repository<Employee>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployeesService,
                {
                    provide: getRepositoryToken(Employee),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<EmployeesService>(EmployeesService);
        repository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of employees', async () => {
            mockRepository.find.mockResolvedValue([mockEmployee]);

            const result = await service.findAll(1, 10);

            expect(result).toEqual([mockEmployee]);
            expect(mockRepository.find).toHaveBeenCalledWith({
                take: 10,
                skip: 0,
                relations: ['area'],
            });
        });

        it('should apply pagination correctly', async () => {
            mockRepository.find.mockResolvedValue([mockEmployee]);

            await service.findAll(2, 5);

            expect(mockRepository.find).toHaveBeenCalledWith({
                take: 5,
                skip: 5,
                relations: ['area'],
            });
        });

        it('should use default pagination values', async () => {
            mockRepository.find.mockResolvedValue([mockEmployee]);

            await service.findAll();

            expect(mockRepository.find).toHaveBeenCalledWith({
                take: 10,
                skip: 0,
                relations: ['area'],
            });
        });
    });

    describe('findOne', () => {
        it('should return a single employee', async () => {
            mockRepository.findOne.mockResolvedValue(mockEmployee);

            const result = await service.findOne(1);

            expect(result).toEqual(mockEmployee);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['area'],
            });
        });

        it('should return null if employee not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.findOne(999);

            expect(result).toBeNull();
        });
    });
});
