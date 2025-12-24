import { SurveysService } from './surveys.service';
import { Survey } from './survey.entity';
export declare class SurveysController {
    private readonly surveysService;
    constructor(surveysService: SurveysService);
    findAll(page?: number, limit?: number): Promise<Survey[]>;
}
