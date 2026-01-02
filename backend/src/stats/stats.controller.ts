import { Controller, Get, Param } from '@nestjs/common';
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
}
