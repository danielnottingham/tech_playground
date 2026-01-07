import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SentimentService } from './../src/sentiment/sentiment.service';

describe('SentimentController (e2e)', () => {
    let app: INestApplication;
    let sentimentService: SentimentService;

    const mockSentimentSummary = {
        totalComments: 10,
        averageSentiment: 0.2,
        distribution: { positive: 4, neutral: 4, negative: 2 },
        byField: [
            {
                field: 'comentariosInteresse',
                label: 'Interesse no Cargo',
                totalComments: 5,
                averageSentiment: 0.3,
                distribution: { positive: 2, neutral: 2, negative: 1 },
                examples: { positive: [], neutral: [], negative: [] },
            },
        ],
        topPositive: [],
        topNegative: [],
        wordFrequency: { positive: [], negative: [] },
    };

    const mockCommentFields = [
        { key: 'comentariosInteresse', label: 'Interesse no Cargo', relatedScore: 'interesseNoCargo' },
        { key: 'comentariosContribuicao', label: 'Contribuicao', relatedScore: 'contribuicao' },
    ];

    const mockFieldSentiment = {
        field: 'comentariosInteresse',
        label: 'Interesse no Cargo',
        totalComments: 5,
        averageSentiment: 0.3,
        distribution: { positive: 2, neutral: 2, negative: 1 },
        examples: { positive: [], neutral: [], negative: [] },
    };

    const mockEmployeeSentiment = {
        employeeId: 1,
        comments: [],
        averageSentiment: 0.5,
        distribution: { positive: 1, neutral: 0, negative: 0 },
    };

    const mockCorrelation = [
        { field: 'comentariosInteresse', label: 'Interesse no Cargo', correlation: 0.75, dataPoints: 10 },
    ];

    const mockCommentAnalysis = {
        surveyId: 1,
        employeeId: 1,
        field: 'comentariosInteresse',
        fieldLabel: 'Interesse no Cargo',
        text: 'Excelente trabalho',
        sentiment: {
            score: 0.8,
            label: 'positive',
            confidence: 0.9,
            positiveCount: 2,
            negativeCount: 0,
            tokens: ['excelente', 'trabalho'],
        },
        relatedScore: 5,
    };

    const mockTextAnalysis = {
        score: 0.667,
        label: 'positive',
        confidence: 0.5,
        positiveCount: 1,
        negativeCount: 0,
        tokens: ['excelente', 'trabalho'],
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(SentimentService)
            .useValue({
                getSentimentSummary: jest.fn().mockResolvedValue(mockSentimentSummary),
                getCommentFields: jest.fn().mockReturnValue(mockCommentFields),
                getFieldSentiment: jest.fn().mockResolvedValue(mockFieldSentiment),
                getEmployeeSentiment: jest.fn().mockResolvedValue(mockEmployeeSentiment),
                getSentimentScoreCorrelation: jest.fn().mockResolvedValue(mockCorrelation),
                analyzeAllComments: jest.fn().mockResolvedValue([mockCommentAnalysis]),
                analyzeText: jest.fn().mockReturnValue(mockTextAnalysis),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        sentimentService = moduleFixture.get<SentimentService>(SentimentService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/sentiment/summary (GET)', () => {
        it('should return sentiment summary', () => {
            return request(app.getHttpServer())
                .get('/sentiment/summary')
                .expect(200)
                .expect(mockSentimentSummary);
        });
    });

    describe('/sentiment/fields (GET)', () => {
        it('should return comment fields', () => {
            return request(app.getHttpServer())
                .get('/sentiment/fields')
                .expect(200)
                .expect(mockCommentFields);
        });
    });

    describe('/sentiment/fields/:fieldKey (GET)', () => {
        it('should return field sentiment', () => {
            return request(app.getHttpServer())
                .get('/sentiment/fields/comentariosInteresse')
                .expect(200)
                .expect(mockFieldSentiment);
        });
    });

    describe('/sentiment/employees/:id (GET)', () => {
        it('should return employee sentiment', () => {
            return request(app.getHttpServer())
                .get('/sentiment/employees/1')
                .expect(200)
                .expect(mockEmployeeSentiment);
        });
    });

    describe('/sentiment/correlation (GET)', () => {
        it('should return correlation data', () => {
            return request(app.getHttpServer())
                .get('/sentiment/correlation')
                .expect(200)
                .expect(mockCorrelation);
        });
    });

    describe('/sentiment/comments (GET)', () => {
        it('should return paginated comments', () => {
            return request(app.getHttpServer())
                .get('/sentiment/comments')
                .expect(200)
                .then(response => {
                    expect(response.body.data).toBeDefined();
                    expect(response.body.pagination).toBeDefined();
                    expect(response.body.pagination.page).toBe(1);
                });
        });

        it('should filter by field', () => {
            return request(app.getHttpServer())
                .get('/sentiment/comments?field=comentariosInteresse')
                .expect(200);
        });

        it('should filter by sentiment', () => {
            return request(app.getHttpServer())
                .get('/sentiment/comments?sentiment=positive')
                .expect(200);
        });

        it('should handle pagination', () => {
            return request(app.getHttpServer())
                .get('/sentiment/comments?page=2&limit=10')
                .expect(200)
                .then(response => {
                    expect(response.body.pagination.page).toBe(2);
                    expect(response.body.pagination.limit).toBe(10);
                });
        });
    });

    describe('/sentiment/analyze (POST)', () => {
        it('should analyze custom text', () => {
            return request(app.getHttpServer())
                .post('/sentiment/analyze')
                .send({ text: 'Excelente trabalho!' })
                .expect(201)
                .then(response => {
                    expect(response.body.text).toBe('Excelente trabalho!');
                    expect(response.body.sentiment).toBeDefined();
                    expect(response.body.sentiment.label).toBe('positive');
                });
        });
    });
});
