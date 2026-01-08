import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttritionRiskService } from './attrition-risk.service';
import { AttritionRiskController } from './attrition-risk.controller';
import { Survey } from '../surveys/survey.entity';
import { Employee } from '../employees/employee.entity';
import { SentimentModule } from '../sentiment/sentiment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Survey, Employee]),
        SentimentModule,
    ],
    providers: [AttritionRiskService],
    controllers: [AttritionRiskController],
    exports: [AttritionRiskService],
})
export class AttritionRiskModule {}
