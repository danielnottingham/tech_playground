import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('company')
    async getCompanyReport(@Query('format') format: string = 'json') {
        const data = await this.reportsService.generateCompanyReport();

        if (format === 'html') {
            return {
                html: this.reportsService.generateCompanyReportHtml(data),
                data,
            };
        }

        return data;
    }

    @Get('company/html')
    async getCompanyReportHtml(@Res() res: Response) {
        const data = await this.reportsService.generateCompanyReport();
        const html = this.reportsService.generateCompanyReportHtml(data);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    @Get('company/download')
    async downloadCompanyReport(@Res() res: Response) {
        const data = await this.reportsService.generateCompanyReport();
        const html = this.reportsService.generateCompanyReportHtml(data);

        const filename = `relatorio-empresa-${new Date().toISOString().split('T')[0]}.html`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
    }

    @Get('areas/:id')
    async getAreaReport(
        @Param('id') id: string,
        @Query('format') format: string = 'json',
    ) {
        const data = await this.reportsService.generateAreaReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Area with ID ${id} not found`);
        }

        if (format === 'html') {
            return {
                html: this.reportsService.generateAreaReportHtml(data),
                data,
            };
        }

        return data;
    }

    @Get('areas/:id/html')
    async getAreaReportHtml(@Param('id') id: string, @Res() res: Response) {
        const data = await this.reportsService.generateAreaReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Area with ID ${id} not found`);
        }

        const html = this.reportsService.generateAreaReportHtml(data);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    @Get('areas/:id/download')
    async downloadAreaReport(@Param('id') id: string, @Res() res: Response) {
        const data = await this.reportsService.generateAreaReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Area with ID ${id} not found`);
        }

        const html = this.reportsService.generateAreaReportHtml(data);
        const filename = `relatorio-area-${data.area.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
    }

    @Get('employees/:id')
    async getEmployeeReport(
        @Param('id') id: string,
        @Query('format') format: string = 'json',
    ) {
        const data = await this.reportsService.generateEmployeeReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        if (format === 'html') {
            return {
                html: this.reportsService.generateEmployeeReportHtml(data),
                data,
            };
        }

        return data;
    }

    @Get('employees/:id/html')
    async getEmployeeReportHtml(@Param('id') id: string, @Res() res: Response) {
        const data = await this.reportsService.generateEmployeeReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        const html = this.reportsService.generateEmployeeReportHtml(data);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    @Get('employees/:id/download')
    async downloadEmployeeReport(@Param('id') id: string, @Res() res: Response) {
        const data = await this.reportsService.generateEmployeeReport(Number(id));

        if (!data) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        const html = this.reportsService.generateEmployeeReportHtml(data);
        const filename = `relatorio-funcionario-${data.employee.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
    }
}
