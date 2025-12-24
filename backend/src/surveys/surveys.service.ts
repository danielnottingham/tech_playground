import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';

@Injectable()
export class SurveysService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
    ) { }

    findAll(page: number = 1, limit: number = 10): Promise<Survey[]> {
        return this.surveysRepository.find({
            take: limit,
            skip: (page - 1) * limit,
            relations: ['employee'],
        });
    }
}
