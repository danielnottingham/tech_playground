import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { Area } from '../areas/area.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Survey, Employee, Area])],
    providers: [StatsService],
    controllers: [StatsController],
})
export class StatsModule { }
