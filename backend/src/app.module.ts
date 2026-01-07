import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from './employees/employees.module';
import { AreasModule } from './areas/areas.module';
import { SurveysModule } from './surveys/surveys.module';
import { StatsModule } from './stats/stats.module';
import { SentimentModule } from './sentiment/sentiment.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
            username: process.env.DATABASE_USER || 'user',
            password: process.env.DATABASE_PASSWORD || 'password',
            database: process.env.DATABASE_NAME || 'tech_playground',
            autoLoadEntities: true,
            synchronize: false,
            logging: true,
        }),
        EmployeesModule,
        AreasModule,
        SurveysModule,
        StatsModule,
        SentimentModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
