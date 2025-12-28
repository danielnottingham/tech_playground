import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<Employee[]> {
        return this.employeesService.findAll(Number(page), Number(limit));
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Employee> {
        const employee = await this.employeesService.findOne(Number(id));
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        return employee;
    }
}
