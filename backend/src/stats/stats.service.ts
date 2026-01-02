import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../surveys/survey.entity';
import { Area } from '../areas/area.entity';
import { Employee } from '../employees/employee.entity';

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(Survey)
        private surveysRepository: Repository<Survey>,
        @InjectRepository(Area)
        private areasRepository: Repository<Area>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
    ) { }

    async getCompanyStats() {
        const surveys = await this.surveysRepository.find();

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys),
        };
    }

    async getAreaStats() {
        const areas = await this.areasRepository.find();
        const result = [];

        for (const area of areas) {
            const stats = await this.getAreaStatsById(area.id);
            if (stats.total_surveys > 0) {
                result.push({
                    area: area,
                    stats: stats
                });
            }
        }

        return result;
    }

    async getAreaStatsById(areaId: number) {
        const surveys = await this.surveysRepository.find({
            relations: ['employee', 'employee.area'],
            where: {
                employee: {
                    area: {
                        id: areaId
                    }
                }
            }
        });

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys)
        };
    }

    async getEmployeeStats(employeeId: number) {
        const surveys = await this.surveysRepository.find({
            where: { employee: { id: employeeId } }
        });

        return {
            total_surveys: surveys.length,
            enps: this.calculateENPS(surveys),
            favorability: this.calculateFavorability(surveys),
            averages: this.calculateAverages(surveys)
        };
    }

    async getEnpsStats() {
        const surveys = await this.surveysRepository.find();
        return this.calculateENPS(surveys);
    }

    private calculateENPS(surveys: Survey[]) {
        const validSurveys = surveys.filter(s => s.enps !== null && s.enps !== undefined);
        const total = validSurveys.length;

        if (total === 0) {
            return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
        }

        const promoters = validSurveys.filter(s => s.enps >= 9).length;
        const passives = validSurveys.filter(s => s.enps >= 7 && s.enps <= 8).length;
        const detractors = validSurveys.filter(s => s.enps <= 6).length;

        const score = ((promoters - detractors) / total) * 100;

        return {
            score: Number(score.toFixed(2)),
            promoters,
            passives,
            detractors,
            total
        };
    }

    private calculateFavorability(surveys: Survey[]) {
        let totalResponses = 0;
        let favorableResponses = 0;

        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia'
        ];

        surveys.forEach(survey => {
            fields.forEach(field => {
                const value = survey[field];
                if (value !== null && value !== undefined) {
                    totalResponses++;
                    if (value >= 4) {
                        favorableResponses++;
                    }
                }
            });
        });

        const score = totalResponses > 0 ? (favorableResponses / totalResponses) * 100 : 0;
        return Number(score.toFixed(2));
    }

    private calculateAverages(surveys: Survey[]) {
        const fields = [
            'interesseNoCargo',
            'contribuicao',
            'aprendizado',
            'feedback',
            'interacaoGestor',
            'clarezaCarreira',
            'expectativaPermanencia'
        ];

        const sums = {};
        const counts = {};

        fields.forEach(f => {
            sums[f] = 0;
            counts[f] = 0;
        });

        surveys.forEach(survey => {
            fields.forEach(field => {
                const value = survey[field];
                if (value !== null && value !== undefined) {
                    sums[field] += value;
                    counts[field]++;
                }
            });
        });

        const averages = {};
        fields.forEach(field => {
            averages[field] = counts[field] > 0 ? Number((sums[field] / counts[field]).toFixed(2)) : 0;
        });

        return averages;
    }
}
