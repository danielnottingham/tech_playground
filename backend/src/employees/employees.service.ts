import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
    ) { }

    findAll(page: number = 1, limit: number = 10): Promise<Employee[]> {
        return this.employeesRepository.find({
            take: limit,
            skip: (page - 1) * limit,
            relations: ['area'],
        });
    }

    findOne(id: number): Promise<Employee | null> {
        return this.employeesRepository.findOne({
            where: { id },
            relations: ['area'],
        });
    }
}
