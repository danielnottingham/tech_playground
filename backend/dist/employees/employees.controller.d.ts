import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    findAll(page?: number, limit?: number): Promise<Employee[]>;
    findOne(id: string): Promise<Employee | null>;
}
