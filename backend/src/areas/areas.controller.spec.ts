import { Test, TestingModule } from '@nestjs/testing';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

describe('AreasController', () => {
    let controller: AreasController;
    let service: AreasService;

    const mockArea = {
        id: 1,
        n0Empresa: 'empresa',
        n1Diretoria: 'diretoria a',
        n2Gerencia: 'gerência a1',
        n3Coordenacao: 'coordenação a11',
        n4Area: 'área a112',
    };

    const mockAreasService = {
        findAll: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AreasController],
            providers: [
                {
                    provide: AreasService,
                    useValue: mockAreasService,
                },
            ],
        }).compile();

        controller = module.get<AreasController>(AreasController);
        service = module.get<AreasService>(AreasService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of areas', async () => {
            mockAreasService.findAll.mockResolvedValue([mockArea]);

            const result = await controller.findAll();

            expect(result).toEqual([mockArea]);
            expect(service.findAll).toHaveBeenCalled();
        });
    });
});
