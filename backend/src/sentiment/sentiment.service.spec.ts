import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SentimentService } from './sentiment.service';
import { Survey } from '../surveys/survey.entity';

describe('SentimentService', () => {
    let service: SentimentService;
    let surveysRepository: Repository<Survey>;

    const mockSurveys = [
        {
            id: 1,
            employee: { id: 1 },
            comentariosInteresse: 'Excelente ambiente de trabalho, muito satisfeito!',
            interesseNoCargo: 5,
            comentariosContribuicao: null,
            contribuicao: 4,
            comentariosAprendizado: 'Bom, mas poderia melhorar',
            aprendizado: 3,
            comentariosFeedback: null,
            feedback: 4,
            comentariosInteracao: 'Gestor muito atencioso e prestativo',
            interacaoGestor: 5,
            comentariosClareza: null,
            clarezaCarreira: 4,
            comentariosExpectativa: null,
            expectativaPermanencia: 5,
            enpsComentario: 'Recomendo a empresa para todos!',
            enps: 10,
        },
        {
            id: 2,
            employee: { id: 2 },
            comentariosInteresse: 'Trabalho ruim e estressante',
            interesseNoCargo: 2,
            comentariosContribuicao: 'Frustrado com a falta de reconhecimento',
            contribuicao: 2,
            comentariosAprendizado: null,
            aprendizado: 2,
            comentariosFeedback: 'Nenhum feedback do gestor',
            feedback: 1,
            comentariosInteracao: null,
            interacaoGestor: 2,
            comentariosClareza: 'Muito confuso sobre o futuro',
            clarezaCarreira: 1,
            comentariosExpectativa: null,
            expectativaPermanencia: 2,
            enpsComentario: 'Não recomendo de forma alguma',
            enps: 3,
        },
        {
            id: 3,
            employee: { id: 3 },
            comentariosInteresse: 'Normal, nada especial',
            interesseNoCargo: 3,
            comentariosContribuicao: null,
            contribuicao: 3,
            comentariosAprendizado: null,
            aprendizado: 3,
            comentariosFeedback: null,
            feedback: 3,
            comentariosInteracao: null,
            interacaoGestor: 3,
            comentariosClareza: null,
            clarezaCarreira: 3,
            comentariosExpectativa: null,
            expectativaPermanencia: 3,
            enpsComentario: null,
            enps: 7,
        },
    ];

    const mockSurveyRepository = {
        find: jest.fn().mockResolvedValue(mockSurveys),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SentimentService,
                { provide: getRepositoryToken(Survey), useValue: mockSurveyRepository },
            ],
        }).compile();

        service = module.get<SentimentService>(SentimentService);
        surveysRepository = module.get<Repository<Survey>>(getRepositoryToken(Survey));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('preprocessText', () => {
        it('should convert text to lowercase and tokenize', () => {
            const result = service.preprocessText('Hello World Test');
            expect(result).toEqual(['hello', 'world', 'test']);
        });

        it('should remove URLs', () => {
            const result = service.preprocessText('Confira https://example.com aqui');
            expect(result).toEqual(['confira', 'aqui']);
        });

        it('should remove email addresses', () => {
            const result = service.preprocessText('Contato email@test.com aqui');
            expect(result).toEqual(['contato', 'aqui']);
        });

        it('should handle empty text', () => {
            const result = service.preprocessText('');
            expect(result).toEqual([]);
        });

        it('should handle null text', () => {
            const result = service.preprocessText(null);
            expect(result).toEqual([]);
        });

        it('should preserve accented characters', () => {
            const result = service.preprocessText('Ótimo contribuição satisfação');
            expect(result).toContain('ótimo');
            expect(result).toContain('contribuição');
            expect(result).toContain('satisfação');
        });
    });

    describe('analyzeText', () => {
        it('should identify positive sentiment', () => {
            const result = service.analyzeText('Excelente trabalho, muito satisfeito!');
            expect(result.label).toBe('positive');
            expect(result.score).toBeGreaterThan(0);
            expect(result.positiveCount).toBeGreaterThan(0);
        });

        it('should identify negative sentiment', () => {
            const result = service.analyzeText('Trabalho ruim e estressante, muito frustrado');
            expect(result.label).toBe('negative');
            expect(result.score).toBeLessThan(0);
            expect(result.negativeCount).toBeGreaterThan(0);
        });

        it('should identify neutral sentiment', () => {
            const result = service.analyzeText('O dia foi normal sem nada especial');
            expect(result.label).toBe('neutral');
        });

        it('should handle negation', () => {
            const result = service.analyzeText('Não estou satisfeito');
            expect(result.score).toBeLessThan(0);
        });

        it('should handle intensifiers', () => {
            const resultWithIntensifier = service.analyzeText('Muito bom');
            const resultWithoutIntensifier = service.analyzeText('Bom');
            expect(resultWithIntensifier.score).toBeGreaterThan(resultWithoutIntensifier.score);
        });

        it('should handle diminishers', () => {
            const resultWithDiminisher = service.analyzeText('Um pouco bom');
            const resultWithoutDiminisher = service.analyzeText('Bom');
            expect(resultWithDiminisher.score).toBeLessThan(resultWithoutDiminisher.score);
        });

        it('should handle empty text', () => {
            const result = service.analyzeText('');
            expect(result.label).toBe('neutral');
            expect(result.score).toBe(0);
            expect(result.confidence).toBe(0);
        });

        it('should return tokens', () => {
            const result = service.analyzeText('Excelente trabalho realizado');
            expect(result.tokens).toBeDefined();
            expect(result.tokens.length).toBeGreaterThan(0);
        });

        it('should calculate confidence score', () => {
            const result = service.analyzeText('Excelente ótimo maravilhoso fantástico');
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('analyzeAllComments', () => {
        it('should analyze all comments from surveys', async () => {
            const results = await service.analyzeAllComments();

            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('surveyId');
            expect(results[0]).toHaveProperty('field');
            expect(results[0]).toHaveProperty('sentiment');
            expect(results[0].sentiment).toHaveProperty('score');
            expect(results[0].sentiment).toHaveProperty('label');
        });

        it('should skip empty comments', async () => {
            const results = await service.analyzeAllComments();

            // Survey 3 has only one comment (comentariosInteresse)
            const survey3Comments = results.filter(r => r.surveyId === 3);
            expect(survey3Comments.length).toBe(1);
        });

        it('should include related scores', async () => {
            const results = await service.analyzeAllComments();

            const commentWithScore = results.find(
                r => r.field === 'comentariosInteresse' && r.surveyId === 1
            );
            expect(commentWithScore.relatedScore).toBe(5);
        });
    });

    describe('getSentimentSummary', () => {
        it('should return summary with distribution', async () => {
            const summary = await service.getSentimentSummary();

            expect(summary.totalComments).toBeGreaterThan(0);
            expect(summary.distribution).toHaveProperty('positive');
            expect(summary.distribution).toHaveProperty('negative');
            expect(summary.distribution).toHaveProperty('neutral');
        });

        it('should return analysis by field', async () => {
            const summary = await service.getSentimentSummary();

            expect(summary.byField).toBeDefined();
            expect(summary.byField.length).toBeGreaterThan(0);
            expect(summary.byField[0]).toHaveProperty('field');
            expect(summary.byField[0]).toHaveProperty('totalComments');
            expect(summary.byField[0]).toHaveProperty('averageSentiment');
        });

        it('should return top positive and negative comments', async () => {
            const summary = await service.getSentimentSummary();

            expect(summary.topPositive).toBeDefined();
            expect(summary.topNegative).toBeDefined();
        });

        it('should return word frequency', async () => {
            const summary = await service.getSentimentSummary();

            expect(summary.wordFrequency).toBeDefined();
            expect(summary.wordFrequency.positive).toBeDefined();
            expect(summary.wordFrequency.negative).toBeDefined();
        });
    });

    describe('getFieldSentiment', () => {
        it('should return sentiment for a valid field', async () => {
            const result = await service.getFieldSentiment('comentariosInteresse');

            expect(result).toBeDefined();
            expect(result.field).toBe('comentariosInteresse');
            expect(result.totalComments).toBeGreaterThan(0);
        });

        it('should return null for invalid field', async () => {
            const result = await service.getFieldSentiment('invalidField');
            expect(result).toBeNull();
        });

        it('should include examples', async () => {
            const result = await service.getFieldSentiment('comentariosInteresse');

            expect(result.examples).toBeDefined();
            expect(result.examples.positive).toBeDefined();
            expect(result.examples.negative).toBeDefined();
            expect(result.examples.neutral).toBeDefined();
        });
    });

    describe('getEmployeeSentiment', () => {
        it('should return sentiment for employee with comments', async () => {
            mockSurveyRepository.find.mockResolvedValueOnce([mockSurveys[0]]);

            const result = await service.getEmployeeSentiment(1);

            expect(result.employeeId).toBe(1);
            expect(result.comments.length).toBeGreaterThan(0);
            expect(result.averageSentiment).toBeDefined();
            expect(result.distribution).toBeDefined();
        });

        it('should return empty for employee without surveys', async () => {
            mockSurveyRepository.find.mockResolvedValueOnce([]);

            const result = await service.getEmployeeSentiment(999);

            expect(result.comments.length).toBe(0);
            expect(result.averageSentiment).toBe(0);
        });
    });

    describe('getSentimentScoreCorrelation', () => {
        it('should calculate correlation between sentiment and scores', async () => {
            const result = await service.getSentimentScoreCorrelation();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should include field information', async () => {
            const result = await service.getSentimentScoreCorrelation();

            if (result.length > 0) {
                expect(result[0]).toHaveProperty('field');
                expect(result[0]).toHaveProperty('label');
                expect(result[0]).toHaveProperty('correlation');
                expect(result[0]).toHaveProperty('dataPoints');
            }
        });
    });

    describe('getCommentFields', () => {
        it('should return list of comment fields', () => {
            const fields = service.getCommentFields();

            expect(fields.length).toBe(8);
            expect(fields[0]).toHaveProperty('key');
            expect(fields[0]).toHaveProperty('label');
            expect(fields[0]).toHaveProperty('relatedScore');
        });
    });
});
