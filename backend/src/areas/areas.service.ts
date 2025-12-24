import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';

@Injectable()
export class AreasService {
    constructor(
        @InjectRepository(Area)
        private areasRepository: Repository<Area>,
    ) { }

    findAll(): Promise<Area[]> {
        return this.areasRepository.find();
    }
}
