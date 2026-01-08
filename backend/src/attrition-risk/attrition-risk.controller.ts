import { Controller, Get, Param, Query } from '@nestjs/common';
import { AttritionRiskService, RiskLevel } from './attrition-risk.service';

@Controller('attrition-risk')
export class AttritionRiskController {
    constructor(private readonly attritionRiskService: AttritionRiskService) { }

    @Get('summary')
    getSummary() {
        return this.attritionRiskService.getAttritionRiskSummary();
    }

    @Get('employees')
    getAllEmployeesRisk(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('sortBy') sortBy: 'riskScore' | 'name' = 'riskScore',
        @Query('riskLevel') riskLevel?: RiskLevel,
    ) {
        return this.attritionRiskService.getAllEmployeesRisk(
            Number(page),
            Number(limit),
            sortBy,
            riskLevel,
        );
    }

    @Get('high-risk')
    getHighRiskEmployees(@Query('limit') limit: string = '10') {
        return this.attritionRiskService.getHighRiskEmployees(Number(limit));
    }

    @Get('employees/:id')
    getEmployeeRisk(@Param('id') id: string) {
        return this.attritionRiskService.calculateEmployeeRisk(Number(id));
    }

    @Get('analysis/career-clarity')
    analyzeCareerClarityImpact() {
        return this.attritionRiskService.analyzeCareerClarityImpact();
    }

    @Get('analysis/tenure-pattern')
    analyzeTenurePattern() {
        return this.attritionRiskService.analyzeTenurePattern();
    }
}
