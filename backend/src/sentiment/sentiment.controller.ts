import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import { SentimentService } from './sentiment.service';

@Controller('sentiment')
export class SentimentController {
    constructor(private readonly sentimentService: SentimentService) { }

    @Get('summary')
    getSentimentSummary() {
        return this.sentimentService.getSentimentSummary();
    }

    @Get('fields')
    getCommentFields() {
        return this.sentimentService.getCommentFields();
    }

    @Get('fields/:fieldKey')
    getFieldSentiment(@Param('fieldKey') fieldKey: string) {
        return this.sentimentService.getFieldSentiment(fieldKey);
    }

    @Get('employees/:id')
    getEmployeeSentiment(@Param('id') id: string) {
        return this.sentimentService.getEmployeeSentiment(Number(id));
    }

    @Get('correlation')
    getSentimentScoreCorrelation() {
        return this.sentimentService.getSentimentScoreCorrelation();
    }

    @Get('comments')
    async getAllComments(
        @Query('field') field?: string,
        @Query('sentiment') sentiment?: 'positive' | 'negative' | 'neutral',
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        const allComments = await this.sentimentService.analyzeAllComments();

        let filteredComments = allComments;

        if (field) {
            filteredComments = filteredComments.filter(c => c.field === field);
        }

        if (sentiment) {
            filteredComments = filteredComments.filter(c => c.sentiment.label === sentiment);
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedComments = filteredComments.slice(startIndex, startIndex + limitNum);

        return {
            data: paginatedComments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: filteredComments.length,
                totalPages: Math.ceil(filteredComments.length / limitNum),
            },
        };
    }

    @Post('analyze')
    analyzeText(@Body() body: { text: string }) {
        return {
            text: body.text,
            sentiment: this.sentimentService.analyzeText(body.text),
        };
    }
}
