import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('areas')
export class Area {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'n0_empresa', nullable: true })
    n0Empresa: string;

    @Column({ name: 'n1_diretoria', nullable: true })
    n1Diretoria: string;

    @Column({ name: 'n2_gerencia', nullable: true })
    n2Gerencia: string;

    @Column({ name: 'n3_coordenacao', nullable: true })
    n3Coordenacao: string;

    @Column({ name: 'n4_area', nullable: true })
    n4Area: string;
}
