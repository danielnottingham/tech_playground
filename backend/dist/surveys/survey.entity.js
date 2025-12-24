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
exports.Survey = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("../employees/employee.entity");
let Survey = class Survey {
};
exports.Survey = Survey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Survey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], Survey.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_resposta', type: 'date', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "dataResposta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'interesse_no_cargo', nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "interesseNoCargo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_interesse', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosInteresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "contribuicao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_contribuicao', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosContribuicao", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "aprendizado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_aprendizado', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosAprendizado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "feedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_feedback', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosFeedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'interacao_gestor', nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "interacaoGestor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_interacao', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosInteracao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clareza_carreira', nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "clarezaCarreira", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_clareza', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosClareza", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expectativa_permanencia', nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "expectativaPermanencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios_expectativa', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "comentariosExpectativa", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Survey.prototype, "enps", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'enps_comentario', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Survey.prototype, "enpsComentario", void 0);
exports.Survey = Survey = __decorate([
    (0, typeorm_1.Entity)('surveys')
], Survey);
//# sourceMappingURL=survey.entity.js.map