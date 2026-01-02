import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatsService } from './stats.service';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { Area } from '../areas/area.entity';

describe('StatsService', () => {
    let service: StatsService;
    let surveysRepository: Repository<Survey>;

    const mockSurveys = [
        {
            id: 1, enps: 10, interesseNoCargo: 5, contribuicao: 5, aprendizado: 5, feedback: 5, interacaoGestor: 5, clarezaCarreira: 5, expectativaPermanencia: 5,
            employee: { id: 1, area: { id: 1 } }
        }, // Promoter, Favorable
        {
            id: 2, enps: 8, interesseNoCargo: 3, contribuicao: 3, aprendizado: 3, feedback: 3, interacaoGestor: 3, clarezaCarreira: 3, expectativaPermanencia: 3,
            employee: { id: 2, area: { id: 1 } }
        }, // Passive, Neutral
        {
            id: 3, enps: 5, interesseNoCargo: 1, contribuicao: 1, aprendizado: 1, feedback: 1, interacaoGestor: 1, clarezaCarreira: 1, expectativaPermanencia: 1,
            employee: { id: 3, area: { id: 1 } }
        }, // Detractor, Unfavorable
    ];

    const mockAreas = [
        { id: 1, n4Area: 'Area 1' }
    ];

    const mockSurveyRepository = {
        find: jest.fn().mockResolvedValue(mockSurveys),
    };

    const mockAreaRepository = {
        find: jest.fn().mockResolvedValue(mockAreas),
    };

    const mockEmployeeRepository = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatsService,
                { provide: getRepositoryToken(Survey), useValue: mockSurveyRepository },
                { provide: getRepositoryToken(Area), useValue: mockAreaRepository },
                { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepository },
            ],
        }).compile();

        service = module.get<StatsService>(StatsService);
        surveysRepository = module.get<Repository<Survey>>(getRepositoryToken(Survey));
    });

    it('should calculate company stats correctly', async () => {
        const stats = await service.getCompanyStats();

        // 1 Promoter (33.3%), 1 Detractor (33.3%) -> eNPS = 0
        expect(stats.enps.score).toBe(0);
        expect(stats.enps.promoters).toBe(1);
        expect(stats.enps.detractors).toBe(1);

        // 1 Favorable (all 5s), 1 Neutral (3s), 1 Unfavorable (1s)
        // Total qs = 3 * 7 = 21. Favorable qs = 7. 7/21 = 33.33%
        expect(stats.favorability).toBe(33.33);

        expect(stats.total_surveys).toBe(3);
    });

    it('should calculate area stats correctly', async () => {
        // Mock find for getAreaStatsById
        mockSurveyRepository.find.mockResolvedValueOnce(mockSurveys);

        const stats = await service.getAreaStats();

        expect(stats).toHaveLength(1);
        expect(stats[0].stats.enps.score).toBe(0);
    });
});
