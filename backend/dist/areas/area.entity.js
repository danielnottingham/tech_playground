"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = void 0;
const typeorm_1 = require("typeorm");
let Area = class Area {
};
exports.Area = Area;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Area.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n0_empresa', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "n0Empresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n1_diretoria', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "n1Diretoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n2_gerencia', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "n2Gerencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n3_coordenacao', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "n3Coordenacao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n4_area', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "n4Area", void 0);
exports.Area = Area = __decorate([
    (0, typeorm_1.Entity)('areas')
], Area);
//# sourceMappingURL=area.entity.js.map