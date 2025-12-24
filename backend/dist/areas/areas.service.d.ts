import { Repository } from 'typeorm';
import { Area } from './area.entity';
export declare class AreasService {
    private areasRepository;
    constructor(areasRepository: Repository<Area>);
    findAll(): Promise<Area[]>;
}
