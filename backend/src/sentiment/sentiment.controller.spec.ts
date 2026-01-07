import { Test, TestingModule } from '@nestjs/testing';
import { SentimentController } from './sentiment.controller';
import { SentimentService } from './sentiment.service';

describe('SentimentController', () => {
    let controller: SentimentController;
    let service: SentimentService;

    const mockSentimentSummary = {
        totalComments: 10,
        averageSentiment: 0.2,
        distribution: { positive: 4, neutral: 4, negative: 2 },
        byField: [],
        topPositive: [],
        topNegative: [],
        wordFrequency: { positive: [], negative: [] },
    };

    const mockCommentAnalysis = {
        surveyId: 1,
        employeeId: 1,
        field: 'comentariosInteresse',
        fieldLabel: 'Interesse no Cargo',
        text: 'Excelente trabalho',
        sentiment: {
            score: 0.8,
            label: 'positive' as const,
            confidence: 0.9,
            positiveCount: 2,
            negativeCount: 0,
            tokens: ['excelente', 'trabalho'],
        },
        relatedScore: 5,
    };

    const mockFieldSentiment = {
        field: 'comentariosInteresse',
        label: 'Interesse no Cargo',
        totalComments: 5,
        averageSentiment: 0.3,
        distribution: { positive: 3, neutral: 1, negative: 1 },
        examples: { positive: [], neutral: [], negative: [] },
    };

    const mockEmployeeSentiment = {
        employeeId: 1,
        comments: [mockCommentAnalysis],
        averageSentiment: 0.5,
        distribution: { positive: 1, neutral: 0, negative: 0 },
    };

    const mockCorrelation = [
        { field: 'comentariosInteresse', label: 'Interesse no Cargo', correlation: 0.75, dataPoints: 10 },
    ];

    const mockCommentFields = [
        { key: 'comentariosInteresse', label: 'Interesse no Cargo', relatedScore: 'interesseNoCargo' },
    ];

    const mockSentimentService = {
        getSentimentSummary: jest.fn().mockResolvedValue(mockSentimentSummary),
        getCommentFields: jest.fn().mockReturnValue(mockCommentFields),
        getFieldSentiment: jest.fn().mockResolvedValue(mockFieldSentiment),
        getEmployeeSentiment: jest.fn().mockResolvedValue(mockEmployeeSentiment),
        getSentimentScoreCorrelation: jest.fn().mockResolvedValue(mockCorrelation),
        analyzeAllComments: jest.fn().mockResolvedValue([mockCommentAnalysis]),
        analyzeText: jest.fn().mockReturnValue(mockCommentAnalysis.sentiment),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SentimentController],
            providers: [
                { provide: SentimentService, useValue: mockSentimentService },
            ],
        }).compile();

        controller = module.get<SentimentController>(SentimentController);
        service = module.get<SentimentService>(SentimentService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSentimentSummary', () => {
        it('should return sentiment summary', async () => {
            const result = await controller.getSentimentSummary();

            expect(result).toEqual(mockSentimentSummary);
            expect(service.getSentimentSummary).toHaveBeenCalled();
        });
    });

    describe('getCommentFields', () => {
        it('should return comment fields', () => {
            const result = controller.getCommentFields();

            expect(result).toEqual(mockCommentFields);
            expect(service.getCommentFields).toHaveBeenCalled();
        });
    });

    describe('getFieldSentiment', () => {
        it('should return field sentiment', async () => {
            const result = await controller.getFieldSentiment('comentariosInteresse');

            expect(result).toEqual(mockFieldSentiment);
            expect(service.getFieldSentiment).toHaveBeenCalledWith('comentariosInteresse');
        });
    });

    describe('getEmployeeSentiment', () => {
        it('should return employee sentiment', async () => {
            const result = await controller.getEmployeeSentiment('1');

            expect(result).toEqual(mockEmployeeSentiment);
            expect(service.getEmployeeSentiment).toHaveBeenCalledWith(1);
        });
    });

    describe('getSentimentScoreCorrelation', () => {
        it('should return correlation data', async () => {
            const result = await controller.getSentimentScoreCorrelation();

            expect(result).toEqual(mockCorrelation);
            expect(service.getSentimentScoreCorrelation).toHaveBeenCalled();
        });
    });

    describe('getAllComments', () => {
        it('should return paginated comments', async () => {
            const result = await controller.getAllComments();

            expect(result.data).toBeDefined();
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(20);
        });

        it('should filter by field', async () => {
            await controller.getAllComments('comentariosInteresse');

            expect(service.analyzeAllComments).toHaveBeenCalled();
        });

        it('should filter by sentiment', async () => {
            await controller.getAllComments(undefined, 'positive');

            expect(service.analyzeAllComments).toHaveBeenCalled();
        });

        it('should handle pagination parameters', async () => {
            const result = await controller.getAllComments(undefined, undefined, '2', '10');

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(10);
        });
    });

    describe('analyzeText', () => {
        it('should analyze custom text', () => {
            const text = 'Excelente trabalho!';
            const result = controller.analyzeText({ text });

            expect(result.text).toBe(text);
            expect(result.sentiment).toEqual(mockCommentAnalysis.sentiment);
            expect(service.analyzeText).toHaveBeenCalledWith(text);
        });
    });
});
