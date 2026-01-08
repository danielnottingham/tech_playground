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
- [Premissas e Decisões de Projeto](#premissas-e-decisões-de-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

## 🏆 Status do Desafio Técnico

Abaixo está a lista de tarefas concluídas conforme os requisitos do desafio:

- [x] **Task 1**: Create a Basic Database
- [x] **Task 2**: Create a Basic Dashboard
- [x] **Task 3**: Create a Test Suite
- [x] **Task 4**: Create a Docker Compose Setup
- [x] **Task 5**: Exploratory Data Analysis
- [x] **Task 6**: Data Visualization - Company Level
- [x] **Task 7**: Data Visualization - Area Level
- [x] **Task 8**: Data Visualization - Employee Level
- [x] **Task 9**: Build a Simple API
- [x] **Task 10**: Sentiment Analysis
- [x] **Task 11**: Report Generation
- [x] **Task 12**: Creative Exploration (Attrition Risk Analysis)

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
│   │   ├── stats/       # Módulo de estatísticas
│   │   └── main.ts      # Ponto de entrada
│   └── test/            # Testes e2e
├── frontend/            # Dashboard React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas (Dashboard, Areas)
│   │   └── services/    # Cliente API (Axios)
│   └── Dockerfile       # Configuração Docker do frontend
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
- Criar e iniciar o container do frontend React
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
O dashboard estará disponível em: `http://localhost:5173`

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

O servidor (API) estará disponível em: `http://localhost:3000`
O dashboard (Frontend) estará disponível em: `http://localhost:5173`

## Funcionalidades do Dashboard

### 📊 Visão Geral (Company)
- **Métricas Principais**: eNPS atual, índice de favorabilidade, total de pesquisas.
- **Gráficos**:
  - Distribuição eNPS (Promoters vs Passives vs Detractors).
  - Distribuição de notas por competência (Liderança, Carreira, etc.).

### 🏢 Áreas (Areas)
- **Lista de Áreas**: Comparativo rápido entre setores com cards de resumo.
- **Detalhes da Área**: Visão aprofundada de uma área específica, permitindo comparar com a média da empresa.

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

### Análise de Sentimento (Sentiment)

- **GET** `/sentiment/summary` - Resumo geral do sentimento de todos os comentários
  - Retorna: total de comentários, média de sentimento, distribuição (positivo/neutro/negativo), análise por campo
- **GET** `/sentiment/fields` - Lista os campos de comentários disponíveis para análise
- **GET** `/sentiment/fields/:fieldKey` - Análise de sentimento para um campo específico
  - Exemplo: `GET /sentiment/fields/enpsComentario`
- **GET** `/sentiment/employees/:id` - Análise de sentimento dos comentários de um funcionário
- **GET** `/sentiment/correlation` - Correlação entre sentimento e scores numéricos
- **GET** `/sentiment/comments` - Lista paginada de comentários com análise de sentimento
  - Query params: `field`, `sentiment` (positive/neutral/negative), `page`, `limit`
  - Exemplo: `GET /sentiment/comments?sentiment=negative&limit=10`
- **POST** `/sentiment/analyze` - Analisa o sentimento de um texto customizado
  - Body: `{ "text": "Texto para analisar" }`

### Relatórios (Reports)

- **GET** `/reports/company` - Gera relatório geral da empresa (JSON)
  - Query params: `format` (json ou html)
  - Exemplo: `GET /reports/company?format=html`
- **GET** `/reports/company/html` - Retorna relatório da empresa em HTML
- **GET** `/reports/company/download` - Download do relatório da empresa em HTML
- **GET** `/reports/areas/:id` - Gera relatório de uma área específica
  - Query params: `format` (json ou html)
  - Exemplo: `GET /reports/areas/1?format=html`
- **GET** `/reports/areas/:id/html` - Retorna relatório da área em HTML
- **GET** `/reports/areas/:id/download` - Download do relatório da área em HTML
- **GET** `/reports/employees/:id` - Gera relatório de um funcionário específico
  - Query params: `format` (json ou html)
  - Exemplo: `GET /reports/employees/1?format=html`
- **GET** `/reports/employees/:id/html` - Retorna relatório do funcionário em HTML
- **GET** `/reports/employees/:id/download` - Download do relatório do funcionário em HTML

### Risco de Atrito (Attrition Risk) - Task 12: Creative Exploration

- **GET** `/attrition-risk/summary` - Resumo geral do risco de atrito da empresa
  - Retorna: total de colaboradores, distribuição de risco (crítico/alto/moderado/baixo), principais fatores de risco, análise demográfica
- **GET** `/attrition-risk/employees` - Lista todos colaboradores com avaliação de risco
  - Query params: `page`, `limit`, `sortBy` (riskScore ou name), `riskLevel` (critical/high/moderate/low)
  - Exemplo: `GET /attrition-risk/employees?page=1&limit=20&sortBy=riskScore&riskLevel=high`
- **GET** `/attrition-risk/high-risk` - Lista colaboradores em alto risco (crítico + alto)
  - Query params: `limit` (padrão: 10)
  - Exemplo: `GET /attrition-risk/high-risk?limit=15`
- **GET** `/attrition-risk/employees/:id` - Avaliação de risco de um colaborador específico
  - Retorna: score de risco, nível de risco, fatores contribuintes, recomendações de ação
  - Exemplo: `GET /attrition-risk/employees/1`
- **GET** `/attrition-risk/analysis/career-clarity` - Análise do impacto da clareza de carreira no risco
  - Retorna: hipótese, correlação, conclusão estatística
- **GET** `/attrition-risk/analysis/tenure-pattern` - Análise do padrão de risco por tempo de empresa
  - Retorna: hipótese, maior/menor risco por tenure, padrão identificado

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

# Ver resumo de sentimento
curl http://localhost:3000/sentiment/summary

# Ver comentários negativos
curl "http://localhost:3000/sentiment/comments?sentiment=negative&limit=5"

# Analisar texto customizado
curl -X POST http://localhost:3000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Excelente ambiente de trabalho"}'

# Gerar relatório da empresa
curl http://localhost:3000/reports/company

# Gerar relatório da empresa em HTML
curl http://localhost:3000/reports/company/html

# Gerar relatório de uma área específica
curl http://localhost:3000/reports/areas/1

# Gerar relatório de um funcionário
curl http://localhost:3000/reports/employees/1

# Ver resumo de risco de atrito
curl http://localhost:3000/attrition-risk/summary

# Ver colaboradores em alto risco
curl http://localhost:3000/attrition-risk/high-risk

# Ver risco de um colaborador específico
curl http://localhost:3000/attrition-risk/employees/1

# Ver análise de impacto da clareza de carreira
curl http://localhost:3000/attrition-risk/analysis/career-clarity

# Ver padrão de risco por tempo de empresa
curl http://localhost:3000/attrition-risk/analysis/tenure-pattern
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
## Premissas e Decisões de Projeto

Para atender aos requisitos do desafio e garantir uma solução robusta, as seguintes premissas e decisões técnicas foram adotadas:

### 1. Arquitetura e Separação de Responsabilidades
- **ETL Dedicado (Ruby)**: Optou-se por criar um script de importação independente em Ruby (`import_data.rb`). A decisão baseia-se na facilidade do Ruby para processamento de texto e scripts de automação. Isso desacopla a lógica de "ingestão de dados" da lógica de "serviço de dados" (API), permitindo que a importação seja executada on-demand ou via job agendado sem impactar a performance da API.

- **Backend (NestJS) vs Frontend (React)**: A separação clara entre cliente e servidor permite que ambas as pontas evoluam independentemente. O NestJS foi escolhido pela sua estrutura modular e suporte nativo a TypeScript, facilitando a manutenção e testes.

### 2. Modelagem de Dados
- **Normalização de Áreas**: Ao invés de repetir a hierarquia de áreas (N0 a N4) em cada registro de funcionário, decidiu-se normalizar essa estrutura na tabela `areas`. Isso evita inconsistências de dados (ex: grafias diferentes para a mesma área) e facilita consultas hierárquicas.

- **Manutenção dos Nomes em Português**: No banco de dados, optou-se por manter os nomes das colunas alinhados com o CSV original (ex: `n0_empresa`, `cargo`). Isso facilita a rastreabilidade dos dados e reduz erros de tradução/interpretação durante o processo de importação e validação.

### 3. Performance e Otimização
- **Índices Estratégicos**: Foram criados índices específicos (`idx_employees_area_id`, `idx_surveys_enps`, etc.) antecipando as queries mais frequentes dos dashboards, como filtros por área e cálculos de eNPS.

- **Cálculo de Métricas**: As métricas de eNPS e favorabilidade são calculadas em tempo real pelo banco de dados (via queries otimizadas) para garantir que o dashboard reflita sempre o estado atual dos dados sem necessidade de jobs de pré-agregação complexos para este volume de dados.

### 4. Suposições sobre os Dados
- **Unicidade do Funcionário**: Assumiu-se que o `email` é a chave única para identificar um funcionário.

- **Hierarquia Fixa**: Assumiu-se que a estrutura N0-N4 é estável e define a alocação de um funcionário.

---


## Tecnologias Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados relacional

### Frontend
- **React** - Biblioteca UI
- **Vite** - Build tool e dev server
- **TailwindCSS** - Framework de estilização
- **Chart.js** - Biblioteca de gráficos
- **Axios** - Cliente HTTP

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

## Task 12: Creative Exploration - Análise de Risco de Atrito

### Objetivo

Implementar uma análise criativa que identifica colaboradores em risco de desligamento através de um algoritmo multifatorial que combina diferentes indicadores da pesquisa de satisfação.

### Hipótese

**"Podemos prever o risco de atrito de colaboradores combinando múltiplos fatores como expectativa de permanência, eNPS, clareza de carreira, interação com gestor e sentimento dos comentários."**

### Metodologia

O algoritmo de risco de atrito calcula um score de 0 a 100 combinando 8 fatores com pesos específicos:

| Fator | Peso | Descrição |
|-------|------|-----------|
| Expectativa de Permanência | 25% | Indicador mais direto de intenção de ficar na empresa |
| Score eNPS | 20% | Indicador geral de satisfação e lealdade |
| Clareza de Carreira | 15% | Percepção de oportunidades de desenvolvimento |
| Interação com Gestor | 12% | Qualidade do relacionamento com liderança |
| Sentimento dos Comentários | 10% | Análise de sentimento via NLP (integração com Task 10) |
| Feedback | 8% | Percepção da qualidade do feedback recebido |
| Aprendizado | 5% | Oportunidades de desenvolvimento |
| Contribuição | 5% | Senso de contribuição para a equipe |

### Classificação de Risco

- **Crítico (>=70%)**: Ação imediata necessária - reunião com RH e liderança
- **Alto (50-69%)**: Ação preventiva prioritária
- **Moderado (30-49%)**: Monitoramento e melhorias pontuais
- **Baixo (<30%)**: Colaborador estável

### Funcionalidades

1. **Dashboard de Risco**: Visão geral da empresa com distribuição de risco e principais fatores
2. **Lista de Colaboradores em Risco**: Ranking por score de risco com filtros
3. **Perfil Individual de Risco**: Detalhamento dos fatores e recomendações personalizadas
4. **Análise de Hipóteses**:
   - Impacto da clareza de carreira no risco (correlação estatística)
   - Padrão de risco por tempo de empresa

### Recomendações Automáticas

O sistema gera recomendações de ação baseadas nos principais fatores de risco de cada colaborador:

- Baixa expectativa de permanência → Conversa 1:1 sobre planos futuros
- Baixo eNPS → Investigar motivos de insatisfação
- Pouca clareza de carreira → Criar plano de desenvolvimento individual
- Interação fraca com gestor → Melhorar frequência de feedback
- Sentimento negativo → Analisar comentários e abordar preocupações

### Acesso

- **Frontend**: `http://localhost:5173/attrition-risk`
- **API**: `http://localhost:3000/attrition-risk/*`

### Testes

```bash
# Testes unitários do serviço
docker-compose exec -it backend npm test -- --testPathPattern=attrition-risk

# Testes E2E
docker-compose exec -it backend npm run test:e2e -- --testPathPattern=attrition-risk
```

### Conclusão

Esta análise demonstra como múltiplas dimensões da pesquisa de satisfação podem ser combinadas para gerar insights acionáveis para a área de RH, permitindo ações preventivas de retenção de talentos antes que o desligamento ocorra.

## Licença

Este projeto é parte de um desafio técnico.
