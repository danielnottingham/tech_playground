import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
export declare class SurveysService {
    private surveysRepository;
    constructor(surveysRepository: Repository<Survey>);
    findAll(page?: number, limit?: number): Promise<Survey[]>;
}
