# Tech Playground - Employee Survey System

Sistema de análise de pesquisas de funcionários desenvolvido com NestJS, PostgreSQL e Ruby.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração Inicial](#configuração-inicial)
- [Importação de Dados](#importação-de-dados)
- [Executando o Projeto](#executando-o-projeto)
- [Executando os Testes](#executando-os-testes)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** e **Docker Compose**
- **Ruby** 2.7+ (apenas para executar o script de importação localmente)

## Estrutura do Projeto

```
tech_playground/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── employees/   # Módulo de funcionários
│   │   ├── areas/       # Módulo de áreas
│   │   ├── surveys/     # Módulo de pesquisas
│   │   └── main.ts      # Ponto de entrada
│   └── test/            # Testes e2e
├── data.csv             # Dataset para importação
├── import_data.rb       # Script de importação (Ruby)
├── init.sql             # Schema do banco de dados
├── docker-compose.yml   # Configuração Docker
└── spec/                # Testes do importador Ruby
```

## Configuração Inicial

1. Navegue até o diretório do projeto:

```bash
cd tech_playground
```

2. Inicie os serviços com Docker Compose:

```bash
docker-compose up -d
```

Isso irá:
- Criar e iniciar o container PostgreSQL
- Criar e iniciar o container do backend NestJS
- Criar o banco de dados `tech_playground`
- Executar o script `init.sql` para criar as tabelas e índices

3. Verifique se os containers estão rodando:

```bash
docker-compose ps
```

4. Verifique os logs do backend:

```bash
docker-compose logs -f backend
```

O backend estará disponível em: `http://localhost:3000`

## Importação de Dados

### Pré-requisitos para Importação

1. Instale as dependências Ruby localmente:

```bash
bundle install
```

### Executando a Importação

Com o Docker Compose rodando, o banco de dados já está disponível na porta `5432`. Execute o script de importação localmente:

```bash
ruby import_data.rb
```

O script se conectará ao PostgreSQL exposto pelo Docker na porta `5432`.

### Configuração do Script de Importação

O script `import_data.rb` está configurado para se conectar ao banco com as seguintes credenciais (que correspondem ao `docker-compose.yml`):

```ruby
host: 'localhost'
port: 5432
dbname: 'tech_playground'
user: 'user'
password: 'password'
```

### O que o Script Faz

1. **Lê o arquivo `data.csv`** (separado por `;`)
2. **Cria/atualiza áreas** na tabela `areas` (hierarquia n0-n4)
3. **Cria/atualiza funcionários** na tabela `employees` (baseado no email único)
4. **Insere pesquisas** na tabela `surveys` (uma por linha do CSV)

### Verificando a Importação

Após a importação, você pode verificar os dados conectando ao PostgreSQL via Docker:

```bash
docker-compose exec db psql -U user -d tech_playground
```

Execute algumas queries para verificar:

```sql
-- Contar áreas
SELECT COUNT(*) FROM areas;

-- Contar funcionários
SELECT COUNT(*) FROM employees;

-- Contar pesquisas
SELECT COUNT(*) FROM surveys;

-- Ver algumas áreas
SELECT * FROM areas LIMIT 5;

-- Ver alguns funcionários
SELECT e.id, e.nome, e.email, a.n4_area 
FROM employees e 
LEFT JOIN areas a ON e.area_id = a.id 
LIMIT 5;
```

## Executando o Projeto

### Comandos Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs do backend
docker-compose logs -f backend

# Ver logs do banco de dados
docker-compose logs -f db

# Parar os serviços
docker-compose down

# Parar e remover volumes (apaga os dados)
docker-compose down -v

# Reiniciar os serviços
docker-compose restart
```

O servidor estará disponível em: `http://localhost:3000`

## Executando os Testes

### Testes do Importador Ruby

Execute os testes do script de importação localmente:

```bash
bundle exec rspec
```

### Testes do Backend (NestJS)

Todos os testes do backend devem ser executados dentro do container Docker:

#### Testes Unitários

```bash
docker-compose exec -it backend npm test
```

#### Testes E2E (End-to-End)

```bash
docker-compose exec -it backend npm run test:e2e
```

#### Testes com Cobertura

```bash
docker-compose exec -it backend npm run test:cov
```

**Nota**: Os testes e2e requerem que o banco de dados esteja rodando. Certifique-se de que o Docker Compose está ativo antes de executar os testes.

## API Endpoints

A API está disponível em `http://localhost:3000` e possui os seguintes endpoints:

### Funcionários (Employees)

- **GET** `/employees` - Lista todos os funcionários (com paginação)
  - Query params: `page` (padrão: 1), `limit` (padrão: 10)
  - Exemplo: `GET /employees?page=1&limit=20`

- **GET** `/employees/:id` - Busca um funcionário por ID
  - Exemplo: `GET /employees/1`

### Áreas (Areas)

- **GET** `/areas` - Lista todas as áreas
  - Exemplo: `GET /areas`

### Pesquisas (Surveys)

- **GET** `/surveys` - Lista todas as pesquisas (com paginação)
  - Query params: `page` (padrão: 1), `limit` (padrão: 10)
  - Exemplo: `GET /surveys?page=1&limit=20`

### Estatísticas (Stats)

- **GET** `/stats/company` - Métricas gerais da empresa (eNPS, favorabilidade, médias)
- **GET** `/stats/areas` - Métricas agrupadas por área
- **GET** `/stats/areas/:id` - Métricas de uma área específica
- **GET** `/stats/employees/:id` - Métricas de um funcionário específico
- **GET** `/stats/enps` - Cálculo detalhado do eNPS (promoters, passives, detractors)

### Exemplos de Uso

```bash
# Listar funcionários
curl http://localhost:3000/employees

# Buscar funcionário específico
curl http://localhost:3000/employees/1

# Listar áreas
curl http://localhost:3000/areas

# Listar pesquisas
curl http://localhost:3000/surveys

# Ver métricas da empresa
curl http://localhost:3000/stats/company

# Ver detalhe eNPS
curl http://localhost:3000/stats/enps
```

## Banco de Dados

### Schema

O banco de dados possui três tabelas principais:

1. **areas** - Hierarquia organizacional (n0_empresa → n4_area)
2. **employees** - Dados dos funcionários
3. **surveys** - Respostas das pesquisas de satisfação

### Índices

Para otimizar as consultas, os seguintes índices foram criados:

- `idx_employees_area_id` - Índice na coluna `area_id` da tabela `employees`
- `idx_employees_email` - Índice único na coluna `email` da tabela `employees`
- `idx_surveys_employee_id` - Índice na coluna `employee_id` da tabela `surveys`
- `idx_surveys_enps` - Índice parcial na coluna `enps` (apenas valores não nulos)
- `idx_surveys_data_resposta` - Índice na coluna `data_resposta` da tabela `surveys`
- `idx_areas_hierarchy` - Índice composto na hierarquia de áreas

### Estrutura das Tabelas

#### Tabela: areas

```sql
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    n0_empresa VARCHAR(255),
    n1_diretoria VARCHAR(255),
    n2_gerencia VARCHAR(255),
    n3_coordenacao VARCHAR(255),
    n4_area VARCHAR(255),
    UNIQUE(n0_empresa, n1_diretoria, n2_gerencia, n3_coordenacao, n4_area)
);
```

#### Tabela: employees

```sql
CREATE TABLE employees (
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
```

#### Tabela: surveys

```sql
CREATE TABLE surveys (
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
```

## Tecnologias Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados relacional

### Importação
- **Ruby** - Linguagem do script de importação
- **pg** - Gem Ruby para PostgreSQL
- **CSV** - Gem Ruby para parsing de CSV

### Testes
- **Jest** - Framework de testes para Node.js
- **RSpec** - Framework de testes para Ruby
- **Supertest** - Testes HTTP para NestJS

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers

## Troubleshooting

### Erro ao conectar ao banco de dados

- Verifique se os containers estão rodando: `docker-compose ps`
- Verifique os logs do banco: `docker-compose logs db`
- Certifique-se de que a porta 5432 não está sendo usada por outro serviço

### Erro ao importar dados

- Verifique se o arquivo `data.csv` existe no diretório raiz
- Verifique se o separador do CSV é `;` (ponto e vírgula)
- Verifique se o Docker Compose está rodando: `docker-compose ps`
- Verifique os logs de erro do script Ruby

### Erro ao executar testes

- Certifique-se de que o Docker Compose está rodando: `docker-compose ps`
- Para testes e2e, o banco precisa estar acessível dentro do container
- Verifique os logs do backend: `docker-compose logs backend`

### Porta 3000 já em uso

- Altere a porta no `docker-compose.yml` (linha 19)
- Ou pare o processo que está usando a porta 3000

### Container não inicia

- Verifique os logs: `docker-compose logs`
- Tente reconstruir as imagens: `docker-compose build --no-cache`
- Verifique se há conflitos de porta

## Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Acessar shell do container do backend
docker-compose exec backend sh

# Acessar shell do container do banco
docker-compose exec db sh

# Conectar ao PostgreSQL
docker-compose exec db psql -U user -d tech_playground

# Reconstruir containers
docker-compose build

# Limpar tudo (containers, volumes, imagens)
docker-compose down -v --rmi all
```

## Licença

Este projeto é parte de um desafio técnico.
