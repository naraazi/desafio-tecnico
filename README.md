# Desafio Tecnico - Sistema de Controle de Pagamentos

Sistema para cadastro e consulta de pagamentos de um cartorio, desenvolvido como desafio tecnico para vaga de Desenvolvedor Web Pleno.

O projeto e dividido em dois modulos:

- **backend/** - API REST em Node.js + TypeScript + Express + TypeORM + MySQL
- **frontend/** - Interface web em Next.js (App Router) + React, consumindo a API via `fetch`

> Este README reflete o estado atual do codigo.

---

## Sumario

1. Tecnologias utilizadas
2. Estrutura do projeto
3. Como rodar o projeto
4. Modelo de dados
5. Seeds iniciais
6. API - Endpoints disponiveis e exemplos
7. Frontend - Funcionalidades
8. Validacoes e regras de negocio
9. O que foi implementado
10. O que eu faria se tivesse mais tempo
11. Limitacoes conhecidas

---

## Tecnologias utilizadas

### Backend

- Node.js
- TypeScript
- Express
- TypeORM
- MySQL
- Celebrate / Joi (validacoes)
- dotenv

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Fetch API (para chamadas HTTP)

> Observacao: o frontend usa apenas `fetch`.

---

## Estrutura do projeto

backend/src com controllers, services, repositories, entities, routes, database, validations.  
frontend/app com page.tsx e layout.tsx.

---

## Como rodar o projeto

### Opcao 1: Ambiente local

#### Pre-requisitos

- Node.js
- MySQL
- npm ou yarn

#### Configuracao do banco de dados

Crie um banco:

```
CREATE DATABASE cartorio_payments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Backend

Crie `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=cartorio_payments
APP_PORT=3333
```

Rode:

```
cd backend
npm install
npm run dev
```

#### Frontend

Crie `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Rode:

```
cd frontend
npm install
npm run dev
```

### Opcao 2: Docker / docker-compose

Pre-requisitos: Docker + Docker Compose instalados.

Como subir:
```
docker-compose up -d --build
```

Urls:
- Frontend: http://localhost:3000
- API: http://localhost:3333 (ex.: `curl http://localhost:3333/payment-types`)

Observacoes uteis:
- MySQL exposto na porta 3307 do host (mapeia para 3306 no container) para evitar conflito com MySQL local.
- Frontend usa `NEXT_PUBLIC_API_URL=http://localhost:3333`, acessivel pelo navegador.
- Backend tem um pequeno atraso (sleep) e o healthcheck do MySQL inclui start_period para evitar log de conexão recusada na primeira subida.

Diagnostico:
- Logs: `docker-compose logs -f backend` e `docker-compose logs -f frontend`
- Parar/limpar: `docker-compose down` (use `docker-compose down -v` para remover o volume do MySQL)

As variaveis de ambiente usadas no compose ja estao definidas em `docker-compose.yml` (DB_HOST=db, DB_USER=cartorio, DB_PASS=cartorio, DB_NAME=cartorio_payments, NEXT_PUBLIC_API_URL=http://backend:3333). Exemplos de env: `backend/.env.docker.example` e `frontend/.env.local.example`.

---

## Modelo de dados

### PaymentType

- id
- name
- createdAt
- updatedAt

### Payment

- id
- date
- paymentTypeId
- description
- amount
- receiptPath (opcional)
- createdAt
- updatedAt

---

## Seeds iniciais

Ao subir o backend, sao inseridos automaticamente (se nao existirem) os tipos:

- Folha de pagamento
- Combustivel
- Estorno
- Manutencao predial

---

## API - Endpoints disponiveis e exemplos

### /payment-types

- GET /payment-types  
  Exemplo: `curl http://localhost:3333/payment-types`

- POST /payment-types  
  Body:
  ```json
  { "name": "Combustivel" }
  ```

- PUT /payment-types/:id  
  Exemplo: `curl -X PUT http://localhost:3333/payment-types/1 -H "Content-Type: application/json" -d "{\"name\":\"Folha de pagamento\"}"`

- DELETE /payment-types/:id  
  Exemplo: `curl -X DELETE http://localhost:3333/payment-types/1`

### /payments

- GET /payments  
  Com filtros: `curl "http://localhost:3333/payments?paymentTypeId=1&startDate=2025-01-01&endDate=2025-01-31"`

- GET /payments/:id  
  Exemplo: `curl http://localhost:3333/payments/1`

- POST /payments  
  Body:
  ```json
  {
    "date": "2025-01-20",
    "paymentTypeId": 1,
    "description": "Pagamento de folha - janeiro/2025",
    "amount": 15000.5
  }
  ```

- PUT /payments/:id  
  Body:
  ```json
  {
    "date": "2025-01-25",
    "paymentTypeId": 2,
    "description": "Reclassificacao de custo",
    "amount": 1200
  }
  ```

- DELETE /payments/:id  
  Exemplo: `curl -X DELETE http://localhost:3333/payments/1`

### Exemplos de erros

- FK inexistente em pagamento (400):
  ```bash
  curl -X POST http://localhost:3333/payments \
    -H "Content-Type: application/json" \
    -d '{"date":"2025-02-01","paymentTypeId":9999,"description":"Teste FK","amount":100}'
  ```

- Pagamento duplicado (400): envie duas vezes o mesmo corpo normalizado (mesma data, tipo, descricao e valor).
  ```bash
  curl -X POST http://localhost:3333/payments \
    -H "Content-Type: application/json" \
    -d '{"date":"2025-02-01","paymentTypeId":1,"description":"Duplicado","amount":50}'
  ```

---

## Frontend - Funcionalidades

- Listagem de pagamentos
- Filtro por tipo e periodo
- Criacao e edicao de pagamentos
- Exclusao de pagamentos
- CRUD de tipos (criar, editar, excluir) com tabela dedicada
- Carregamento dinamico dos tipos para selects
- Formatacao de datas e valores

---

## Validacoes e regras de negocio

- Celebrate/Joi valida:
  - Body de criacao/edicao de pagamentos
  - Query de filtros de pagamentos
  - Params de id em pagamentos
  - Body e params de criacao/edicao de tipos
  - Params de id em delecao de tipos
- Regras:
  - Normalizacao de data, descricao e valor
  - Proibicao de pagamentos duplicados (data+tipo+descricao+valor) no create/update
  - Checagem de existencia de `paymentTypeId` no service antes de criar/atualizar
  - Tipos com nome unico
  - `GET /payments/:id` retorna 404 se nao encontrado

---

## O que foi implementado

- API completa de pagamentos (CRUD + filtros) e tipos (CRUD)
- Seeds dos tipos sugeridos
- Regra de nao-duplicidade e checagem de FK
- Validacoes com celebrate/Joi
- Frontend com CRUD de pagamentos e CRUD de tipos, filtros e formatacoes
- Modelo de dados conforme o LEAD
- Docker/docker-compose para subir ambiente completo
- README com instrucoes e exemplos de chamadas

---

## O que eu faria se tivesse mais tempo

- Criaria endpoint/pagina de relatorio (`/payments/report`) com total por periodo
- Adicionaria upload de comprovantes usando Multer
- Reestruturaria o frontend separando page.tsx em componentes menores
- Implementaria testes automatizados (Jest ou Vitest)
- Criaria migrations no TypeORM e removeria `synchronize: true`

---

## Limitacoes conhecidas

- Sem endpoint/pagina de relatorio
- Sem upload de comprovante
- Sem testes automatizados
- TypeORM usa `synchronize: true`; sem migrations
