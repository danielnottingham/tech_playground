import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentimentService } from './sentiment.service';
import { SentimentController } from './sentiment.controller';
import { Survey } from '../surveys/survey.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Survey])],
    providers: [SentimentService],
    controllers: [SentimentController],
    exports: [SentimentService],
})
export class SentimentModule {}
