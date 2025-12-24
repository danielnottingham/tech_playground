import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { Survey } from './survey.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Survey])],
    providers: [SurveysService],
    controllers: [SurveysController],
})
export class SurveysModule { }
