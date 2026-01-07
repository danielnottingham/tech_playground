import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { Area } from '../areas/area.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Survey, Employee, Area])],
    providers: [ReportsService],
    controllers: [ReportsController],
    exports: [ReportsService],
})
export class ReportsModule {}
