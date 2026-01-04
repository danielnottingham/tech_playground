import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('company')
    getCompanyStats() {
        return this.statsService.getCompanyStats();
    }

    @Get('areas')
    getAreaStats() {
        return this.statsService.getAreaStats();
    }

    @Get('areas/:id')
    getAreaStatsById(@Param('id') id: string) {
        return this.statsService.getAreaStatsById(Number(id));
    }

    @Get('employees/:id')
    getEmployeeStats(@Param('id') id: string) {
        return this.statsService.getEmployeeStats(Number(id));
    }

    @Get('enps')
    getEnpsStats() {
        return this.statsService.getEnpsStats();
    }

    @Get('eda/summary')
    getSummaryStatistics() {
        return this.statsService.getSummaryStatistics();
    }

    @Get('eda/distribution/:dimension')
    getDistributionByDemographic(
        @Param('dimension') dimension: 'genero' | 'geracao' | 'tempoDeEmpresa'
    ) {
        return this.statsService.getDistributionByDemographic(dimension);
    }

    @Get('eda/responses')
    getResponseDistribution() {
        return this.statsService.getResponseDistribution();
    }

    @Get('eda/correlations')
    getCorrelationMatrix() {
        return this.statsService.getCorrelationMatrix();
    }

    @Get('eda/area-comparison')
    getAreaComparison() {
        return this.statsService.getAreaComparison();
    }

    @Get('employees-list')
    getEmployeesWithStats(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ) {
        return this.statsService.getEmployeesWithStats(
            Number(page),
            Number(limit),
            search,
        );
    }

    @Get('employees/:id/comparison')
    getEmployeeComparison(@Param('id') id: string) {
        return this.statsService.getEmployeeComparison(Number(id));
    }
}
