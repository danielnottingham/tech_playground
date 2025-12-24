import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from '../areas/area.entity';

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn()
    id: number;



    @ManyToOne(() => Area)
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ nullable: true })
    nome: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ name: 'email_corporativo', nullable: true })
    emailCorporativo: string;

    @Column({ nullable: true })
    celular: string;

    @Column({ nullable: true })
    cargo: string;

    @Column({ nullable: true })
    funcao: string;

    @Column({ nullable: true })
    localidade: string;

    @Column({ name: 'tempo_de_empresa', nullable: true })
    tempoDeEmpresa: string;

    @Column({ nullable: true })
    genero: string;

    @Column({ nullable: true })
    geracao: string;
}
