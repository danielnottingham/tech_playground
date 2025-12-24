import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
export declare class EmployeesService {
    private employeesRepository;
    constructor(employeesRepository: Repository<Employee>);
    findAll(page?: number, limit?: number): Promise<Employee[]>;
    findOne(id: number): Promise<Employee | null>;
}
