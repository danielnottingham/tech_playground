import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveysService } from './surveys.service';
import { Survey } from './survey.entity';

describe('SurveysService', () => {
    let service: SurveysService;
    let repository: Repository<Survey>;

    const mockRepository = {
        find: jest.fn(),
    };

    const mockSurvey = {
        id: 1,
        enps: 9,
        dataResposta: '2023-01-01',
        employee: { id: 1 },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SurveysService,
                {
                    provide: getRepositoryToken(Survey),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<SurveysService>(SurveysService);
        repository = module.get<Repository<Survey>>(getRepositoryToken(Survey));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of surveys', async () => {
            mockRepository.find.mockResolvedValue([mockSurvey]);

            const result = await service.findAll(1, 10);

            expect(result).toEqual([mockSurvey]);
            expect(mockRepository.find).toHaveBeenCalledWith({
                take: 10,
                skip: 0,
                relations: ['employee'],
            });
        });

        it('should apply pagination correctly', async () => {
            mockRepository.find.mockResolvedValue([mockSurvey]);

            await service.findAll(2, 5);

            expect(mockRepository.find).toHaveBeenCalledWith({
                take: 5,
                skip: 5,
                relations: ['employee'],
            });
        });
    });
});
