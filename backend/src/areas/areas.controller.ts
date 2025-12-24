import { Controller, Get } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Area } from './area.entity';

@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Get()
    findAll(): Promise<Area[]> {
        return this.areasService.findAll();
    }
}
