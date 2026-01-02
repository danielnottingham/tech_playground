import { Test, TestingModule } from '@nestjs/testing';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';

describe('SurveysController', () => {
    let controller: SurveysController;
    let service: SurveysService;

    const mockSurvey = {
        id: 1,
        enps: 9,
        dataResposta: '2023-01-01',
        employee: { id: 1 },
    };

    const mockSurveysService = {
        findAll: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SurveysController],
            providers: [
                {
                    provide: SurveysService,
                    useValue: mockSurveysService,
                },
            ],
        }).compile();

        controller = module.get<SurveysController>(SurveysController);
        service = module.get<SurveysService>(SurveysService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of surveys', async () => {
            mockSurveysService.findAll.mockResolvedValue([mockSurvey]);

            const result = await controller.findAll(1, 10);

            expect(result).toEqual([mockSurvey]);
            expect(service.findAll).toHaveBeenCalledWith(1, 10);
        });

        it('should handle pagination parameters', async () => {
            mockSurveysService.findAll.mockResolvedValue([mockSurvey]);

            await controller.findAll(2, 5);

            expect(service.findAll).toHaveBeenCalledWith(2, 5);
        });
    });
});
