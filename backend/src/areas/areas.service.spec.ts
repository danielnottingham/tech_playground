import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreasService } from './areas.service';
import { Area } from './area.entity';

describe('AreasService', () => {
    let service: AreasService;
    let repository: Repository<Area>;

    const mockRepository = {
        find: jest.fn(),
    };

    const mockArea = {
        id: 1,
        n0Empresa: 'empresa',
        n1Diretoria: 'diretoria a',
        n2Gerencia: 'gerência a1',
        n3Coordenacao: 'coordenação a11',
        n4Area: 'área a112',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AreasService,
                {
                    provide: getRepositoryToken(Area),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<AreasService>(AreasService);
        repository = module.get<Repository<Area>>(getRepositoryToken(Area));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of areas', async () => {
            mockRepository.find.mockResolvedValue([mockArea]);

            const result = await service.findAll();

            expect(result).toEqual([mockArea]);
            expect(mockRepository.find).toHaveBeenCalled();
        });
    });
});
