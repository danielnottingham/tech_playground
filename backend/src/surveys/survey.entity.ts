import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('surveys')
export class Survey {
    @PrimaryGeneratedColumn()
    id: number;



    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ name: 'data_resposta', type: 'date', nullable: true })
    dataResposta: string;

    @Column({ name: 'interesse_no_cargo', nullable: true })
    interesseNoCargo: number;

    @Column({ name: 'comentarios_interesse', type: 'text', nullable: true })
    comentariosInteresse: string;

    @Column({ nullable: true })
    contribuicao: number;

    @Column({ name: 'comentarios_contribuicao', type: 'text', nullable: true })
    comentariosContribuicao: string;

    @Column({ nullable: true })
    aprendizado: number;

    @Column({ name: 'comentarios_aprendizado', type: 'text', nullable: true })
    comentariosAprendizado: string;

    @Column({ nullable: true })
    feedback: number;

    @Column({ name: 'comentarios_feedback', type: 'text', nullable: true })
    comentariosFeedback: string;

    @Column({ name: 'interacao_gestor', nullable: true })
    interacaoGestor: number;

    @Column({ name: 'comentarios_interacao', type: 'text', nullable: true })
    comentariosInteracao: string;

    @Column({ name: 'clareza_carreira', nullable: true })
    clarezaCarreira: number;

    @Column({ name: 'comentarios_clareza', type: 'text', nullable: true })
    comentariosClareza: string;

    @Column({ name: 'expectativa_permanencia', nullable: true })
    expectativaPermanencia: number;

    @Column({ name: 'comentarios_expectativa', type: 'text', nullable: true })
    comentariosExpectativa: string;

    @Column({ nullable: true })
    enps: number;

    @Column({ name: 'enps_comentario', type: 'text', nullable: true })
    enpsComentario: string;
}
