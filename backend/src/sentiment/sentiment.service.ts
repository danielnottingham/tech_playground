import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../surveys/survey.entity';
import {
    POSITIVE_WORDS,
    NEGATIVE_WORDS,
    NEGATION_WORDS,
    INTENSIFIERS,
    DIMINISHERS,
    STOP_WORDS,
    COMMENT_FIELDS,
} from './portuguese-lexicon';

export interface SentimentResult {
    score: number;          // -1 to 1 normalized score
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;     // 0 to 1
    positiveCount: number;
    negativeCount: number;
    tokens: string[];
}

export interface CommentAnalysis {
    surveyId: number;
    employeeId: number;
    field: string;
    fieldLabel: string;
    text: string;
    sentiment: SentimentResult;
    relatedScore?: number;
}

export interface FieldSentimentSummary {
    field: string;
    label: string;
    totalComments: number;
    averageSentiment: number;
    distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    examples: {
        positive: CommentAnalysis[];
        neutral: CommentAnalysis[];
        negative: CommentAnalysis[];
    };
}

export interface SentimentSummary {
    totalComments: number;
    averageSentiment: number;
    distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    byField: FieldSentimentSummary[];
    topPositive: CommentAnalysis[];
    topNegative: CommentAnalysis[];
    wordFrequency: {
        positive: { word: string; count: number }[];
        negative: { word: string; count: number }[];
    };
}

@Injectable()
export class SentimentService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
    ) {}

    /**
     * Preprocess text for sentiment analysis
     * - Convert to lowercase
     * - Remove punctuation
     * - Normalize accents
     * - Tokenize
     * - Remove stop words (optional)
     */
    preprocessText(text: string, removeStopWords: boolean = false): string[] {
        if (!text) return [];

        // Convert to lowercase
        let processed = text.toLowerCase();

        // Remove URLs
        processed = processed.replace(/https?:\/\/\S+/g, '');

        // Remove email addresses
        processed = processed.replace(/\S+@\S+\.\S+/g, '');

        // Remove special characters but keep accented letters
        processed = processed.replace(/[^\wáàãâéêíóôõúüç\s-]/gi, ' ');

        // Replace multiple spaces with single space
        processed = processed.replace(/\s+/g, ' ').trim();

        // Tokenize
        const tokens = processed.split(' ').filter(t => t.length > 1);

        // Remove stop words if requested
        if (removeStopWords) {
            return tokens.filter(t => !STOP_WORDS.includes(t));
        }

        return tokens;
    }

    /**
     * Normalize text by removing accents (for lexicon matching)
     */
    normalizeText(text: string): string {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    /**
     * Analyze sentiment of a single text
     */
    analyzeText(text: string): SentimentResult {
        if (!text || text.trim().length === 0) {
            return {
                score: 0,
                label: 'neutral',
                confidence: 0,
                positiveCount: 0,
                negativeCount: 0,
                tokens: [],
            };
        }

        const tokens = this.preprocessText(text);
        const normalizedTokens = tokens.map(t => this.normalizeText(t));

        let totalScore = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        let wordCount = 0;
        let isNegated = false;
        let intensifierMultiplier = 1;

        for (let i = 0; i < normalizedTokens.length; i++) {
            const token = normalizedTokens[i];
            const originalToken = tokens[i];

            // Check for negation
            if (NEGATION_WORDS.includes(token)) {
                isNegated = true;
                continue;
            }

            // Check for intensifiers
            if (INTENSIFIERS[token]) {
                intensifierMultiplier = INTENSIFIERS[token];
                continue;
            }

            // Check for diminishers
            if (DIMINISHERS[token]) {
                intensifierMultiplier = DIMINISHERS[token];
                continue;
            }

            // Check positive words (try both normalized and original)
            let score = POSITIVE_WORDS[token] || POSITIVE_WORDS[originalToken] || 0;

            // Check negative words if no positive match
            if (score === 0) {
                score = NEGATIVE_WORDS[token] || NEGATIVE_WORDS[originalToken] || 0;
            }

            if (score !== 0) {
                // Apply negation
                if (isNegated) {
                    score = -score;
                    isNegated = false;
                }

                // Apply intensifier/diminisher
                score *= intensifierMultiplier;
                intensifierMultiplier = 1;

                totalScore += score;
                wordCount++;

                if (score > 0) {
                    positiveCount++;
                } else if (score < 0) {
                    negativeCount++;
                }
            } else {
                // Reset negation after 3 tokens without sentiment word
                if (i > 0 && NEGATION_WORDS.includes(normalizedTokens[i - 3])) {
                    isNegated = false;
                }
            }
        }

        // Calculate normalized score (-1 to 1)
        // Max possible score per word is 3 (or -3), normalized to word count
        const maxPossibleScore = wordCount * 3;
        const normalizedScore = maxPossibleScore > 0
            ? Math.max(-1, Math.min(1, totalScore / maxPossibleScore))
            : 0;

        // Calculate confidence based on sentiment word coverage
        const confidence = tokens.length > 0
            ? Math.min(1, wordCount / Math.max(5, tokens.length / 3))
            : 0;

        // Determine label
        let label: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (normalizedScore > 0.1) {
            label = 'positive';
        } else if (normalizedScore < -0.1) {
            label = 'negative';
        }

        return {
            score: Number(normalizedScore.toFixed(3)),
            label,
            confidence: Number(confidence.toFixed(3)),
            positiveCount,
            negativeCount,
            tokens: tokens.slice(0, 50), // Limit tokens returned
        };
    }

    /**
     * Get all comments with sentiment analysis
     */
    async analyzeAllComments(): Promise<CommentAnalysis[]> {
        const surveys = await this.surveysRepository.find({
            relations: ['employee'],
        });

        const analyses: CommentAnalysis[] = [];

        for (const survey of surveys) {
            for (const field of COMMENT_FIELDS) {
                const text = survey[field.key];
                if (text && text.trim().length > 0) {
                    analyses.push({
                        surveyId: survey.id,
                        employeeId: survey.employee?.id,
                        field: field.key,
                        fieldLabel: field.label,
                        text,
                        sentiment: this.analyzeText(text),
                        relatedScore: survey[field.relatedScore],
                    });
                }
            }
        }

        return analyses;
    }

    /**
     * Get sentiment summary for all comments
     */
    async getSentimentSummary(): Promise<SentimentSummary> {
        const analyses = await this.analyzeAllComments();

        const distribution = {
            positive: 0,
            neutral: 0,
            negative: 0,
        };

        const positiveWords: Record<string, number> = {};
        const negativeWords: Record<string, number> = {};

        let totalSentiment = 0;

        for (const analysis of analyses) {
            totalSentiment += analysis.sentiment.score;
            distribution[analysis.sentiment.label]++;

            // Count word frequencies
            for (const token of analysis.sentiment.tokens) {
                const normalized = this.normalizeText(token);
                if (POSITIVE_WORDS[normalized] || POSITIVE_WORDS[token]) {
                    positiveWords[token] = (positiveWords[token] || 0) + 1;
                }
                if (NEGATIVE_WORDS[normalized] || NEGATIVE_WORDS[token]) {
                    negativeWords[token] = (negativeWords[token] || 0) + 1;
                }
            }
        }

        // Group by field
        const byField: FieldSentimentSummary[] = COMMENT_FIELDS.map(field => {
            const fieldAnalyses = analyses.filter(a => a.field === field.key);
            const fieldDistribution = {
                positive: 0,
                neutral: 0,
                negative: 0,
            };
            let fieldTotalSentiment = 0;

            for (const a of fieldAnalyses) {
                fieldTotalSentiment += a.sentiment.score;
                fieldDistribution[a.sentiment.label]++;
            }

            // Get examples (top 3 of each category by confidence)
            const sortedByScore = [...fieldAnalyses].sort((a, b) =>
                b.sentiment.score - a.sentiment.score
            );
            const positiveExamples = sortedByScore
                .filter(a => a.sentiment.label === 'positive')
                .slice(0, 3);
            const negativeExamples = sortedByScore
                .filter(a => a.sentiment.label === 'negative')
                .slice(-3)
                .reverse();
            const neutralExamples = fieldAnalyses
                .filter(a => a.sentiment.label === 'neutral')
                .slice(0, 3);

            return {
                field: field.key,
                label: field.label,
                totalComments: fieldAnalyses.length,
                averageSentiment: fieldAnalyses.length > 0
                    ? Number((fieldTotalSentiment / fieldAnalyses.length).toFixed(3))
                    : 0,
                distribution: fieldDistribution,
                examples: {
                    positive: positiveExamples,
                    neutral: neutralExamples,
                    negative: negativeExamples,
                },
            };
        }).filter(f => f.totalComments > 0);

        // Top positive and negative comments
        const sortedAnalyses = [...analyses].sort((a, b) =>
            b.sentiment.score - a.sentiment.score
        );
        const topPositive = sortedAnalyses
            .filter(a => a.sentiment.label === 'positive')
            .slice(0, 10);
        const topNegative = sortedAnalyses
            .filter(a => a.sentiment.label === 'negative')
            .slice(-10)
            .reverse();

        // Word frequency
        const sortedPositiveWords = Object.entries(positiveWords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));
        const sortedNegativeWords = Object.entries(negativeWords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));

        return {
            totalComments: analyses.length,
            averageSentiment: analyses.length > 0
                ? Number((totalSentiment / analyses.length).toFixed(3))
                : 0,
            distribution,
            byField,
            topPositive,
            topNegative,
            wordFrequency: {
                positive: sortedPositiveWords,
                negative: sortedNegativeWords,
            },
        };
    }

    /**
     * Get sentiment analysis for a specific comment field
     */
    async getFieldSentiment(fieldKey: string): Promise<FieldSentimentSummary | null> {
        const field = COMMENT_FIELDS.find(f => f.key === fieldKey);
        if (!field) return null;

        const analyses = await this.analyzeAllComments();
        const fieldAnalyses = analyses.filter(a => a.field === fieldKey);

        const distribution = {
            positive: 0,
            neutral: 0,
            negative: 0,
        };
        let totalSentiment = 0;

        for (const a of fieldAnalyses) {
            totalSentiment += a.sentiment.score;
            distribution[a.sentiment.label]++;
        }

        const sortedByScore = [...fieldAnalyses].sort((a, b) =>
            b.sentiment.score - a.sentiment.score
        );

        return {
            field: field.key,
            label: field.label,
            totalComments: fieldAnalyses.length,
            averageSentiment: fieldAnalyses.length > 0
                ? Number((totalSentiment / fieldAnalyses.length).toFixed(3))
                : 0,
            distribution,
            examples: {
                positive: sortedByScore.filter(a => a.sentiment.label === 'positive').slice(0, 5),
                neutral: fieldAnalyses.filter(a => a.sentiment.label === 'neutral').slice(0, 5),
                negative: sortedByScore.filter(a => a.sentiment.label === 'negative').slice(-5).reverse(),
            },
        };
    }

    /**
     * Get sentiment for a specific employee's comments
     */
    async getEmployeeSentiment(employeeId: number): Promise<{
        employeeId: number;
        comments: CommentAnalysis[];
        averageSentiment: number;
        distribution: { positive: number; neutral: number; negative: number };
    }> {
        const surveys = await this.surveysRepository.find({
            where: { employee: { id: employeeId } },
            relations: ['employee'],
        });

        const comments: CommentAnalysis[] = [];
        for (const survey of surveys) {
            for (const field of COMMENT_FIELDS) {
                const text = survey[field.key];
                if (text && text.trim().length > 0) {
                    comments.push({
                        surveyId: survey.id,
                        employeeId: survey.employee?.id,
                        field: field.key,
                        fieldLabel: field.label,
                        text,
                        sentiment: this.analyzeText(text),
                        relatedScore: survey[field.relatedScore],
                    });
                }
            }
        }

        const distribution = {
            positive: 0,
            neutral: 0,
            negative: 0,
        };
        let totalSentiment = 0;

        for (const c of comments) {
            totalSentiment += c.sentiment.score;
            distribution[c.sentiment.label]++;
        }

        return {
            employeeId,
            comments,
            averageSentiment: comments.length > 0
                ? Number((totalSentiment / comments.length).toFixed(3))
                : 0,
            distribution,
        };
    }

    /**
     * Analyze correlation between sentiment and numeric scores
     */
    async getSentimentScoreCorrelation(): Promise<{
        field: string;
        label: string;
        correlation: number;
        dataPoints: number;
    }[]> {
        const analyses = await this.analyzeAllComments();
        const results: {
            field: string;
            label: string;
            correlation: number;
            dataPoints: number;
        }[] = [];

        for (const field of COMMENT_FIELDS) {
            const fieldAnalyses = analyses.filter(
                a => a.field === field.key && a.relatedScore !== null && a.relatedScore !== undefined
            );

            if (fieldAnalyses.length < 5) continue;

            const sentiments = fieldAnalyses.map(a => a.sentiment.score);
            const scores = fieldAnalyses.map(a => a.relatedScore);

            const correlation = this.calculateCorrelation(sentiments, scores);

            results.push({
                field: field.key,
                label: field.label,
                correlation: Number(correlation.toFixed(3)),
                dataPoints: fieldAnalyses.length,
            });
        }

        return results;
    }

    /**
     * Calculate Pearson correlation coefficient
     */
    private calculateCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        if (n === 0) return 0;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Get available comment fields
     */
    getCommentFields(): { key: string; label: string; relatedScore: string }[] {
        return COMMENT_FIELDS;
    }
}
