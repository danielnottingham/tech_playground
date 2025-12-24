CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    n0_empresa VARCHAR(255),
    n1_diretoria VARCHAR(255),
    n2_gerencia VARCHAR(255),
    n3_coordenacao VARCHAR(255),
    n4_area VARCHAR(255),
    UNIQUE(n0_empresa, n1_diretoria, n2_gerencia, n3_coordenacao, n4_area)
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(id),
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_corporativo VARCHAR(255),
    celular VARCHAR(50),
    cargo VARCHAR(255),
    funcao VARCHAR(255),
    localidade VARCHAR(255),
    tempo_de_empresa VARCHAR(100),
    genero VARCHAR(50),
    geracao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    data_resposta DATE,
    
    interesse_no_cargo INTEGER,
    comentarios_interesse TEXT,
    
    contribuicao INTEGER,
    comentarios_contribuicao TEXT,
    
    aprendizado INTEGER,
    comentarios_aprendizado TEXT,
    
    feedback INTEGER,
    comentarios_feedback TEXT,
    
    interacao_gestor INTEGER,
    comentarios_interacao TEXT,
    
    clareza_carreira INTEGER,
    comentarios_clareza TEXT,
    
    expectativa_permanencia INTEGER,
    comentarios_expectativa TEXT,
    
    enps INTEGER,
    enps_comentario TEXT
);
