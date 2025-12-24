import { Controller, Get, Query } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { Survey } from './survey.entity';

@Controller('surveys')
export class SurveysController {
    constructor(private readonly surveysService: SurveysService) { }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<Survey[]> {
        return this.surveysService.findAll(Number(page), Number(limit));
    }
}
