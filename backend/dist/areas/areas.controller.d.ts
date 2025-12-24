import { AreasService } from './areas.service';
import { Area } from './area.entity';
export declare class AreasController {
    private readonly areasService;
    constructor(areasService: AreasService);
    findAll(): Promise<Area[]>;
}
