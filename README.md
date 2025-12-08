# Desafio Tecnico - Sistema de Controle de Pagamentos

Sistema para cadastro e consulta de pagamentos de um cartorio, desenvolvido como desafio tecnico para vaga de Desenvolvedor Web Pleno.

O projeto é dividido em dois módulos:

- **backend/** - API REST em Node.js + TypeScript + Express + TypeORM + MySQL
- **frontend/** - Interface web em Next.js (App Router) + React, consumindo a API via `fetch`

---

## Sumário

1. Tecnologias utilizadas
2. Estrutura do projeto
3. Como rodar o projeto
4. Modelo de dados
5. Seeds iniciais
6. API - Endpoints disponíveis e exemplos
7. Testes automatizados
8. Testes rápidos de API (curl)
9. Frontend - Funcionalidades
10. Validações e regras de negócio
11. O que foi implementado
12. O que eu faria se tivesse mais tempo
13. Limitações conhecidas

---

## Tecnologias utilizadas

### Backend

- Node.js
- TypeScript
- Express
- TypeORM
- MySQL
- Celebrate / Joi (validações)
- Multer + AWS S3 (comprovantes)
- dotenv

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Fetch API

---

## Estrutura do projeto

- backend/src com controllers, services, repositories, entities, routes, database, validations.
- frontend/app com page.tsx e layout.tsx.

---

## Como rodar o projeto

### Opção 1: Ambiente local

Pré-requisitos: Node.js, MySQL, npm ou yarn.

Crie `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=cartorio_payments
APP_PORT=3333
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
S3_BUCKET=seu_bucket_s3_aqui
BUCKET_PRIVADO=true
```

Backend:

```
cd backend
npm install
npm run dev
```

Frontend (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:3333
```

```
cd frontend
npm install
npm run dev
```

### Opção 2: Docker / docker-compose

Pré-requisitos: Docker + Docker Compose.

```
docker-compose up -d --build
```

URLs: Frontend http://localhost:3000 | API http://localhost:3333  
MySQL exposto na porta 3307 do host.  
Env exemplo em `backend/.env.docker.example` e `frontend/.env.local.example`.
Para o docker-compose receber as credenciais AWS/S3, crie um `.env` na raiz do projeto (mesmo nível do `docker-compose.yml`) com: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `BUCKET_PRIVADO`.

---

## Modelo de dados

### PaymentType

- id, name, createdAt, updatedAt

### Payment

- id, date, paymentTypeId, description, amount, receiptPath (opcional), createdAt, updatedAt

---

## Seeds iniciais

Ao subir o backend, são inseridos (se não existirem):

- Folha de pagamento
- Combustível
- Estorno
- Manutenção predial

---

## API - Endpoints disponíveis e exemplos

### /payment-types

- GET /payment-types  
  Ex.: `curl http://localhost:3333/payment-types`
- POST /payment-types  
  Body: `{ "name": "Combustivel" }`
- PUT /payment-types/:id  
  Ex.: `curl -X PUT http://localhost:3333/payment-types/1 -H "Content-Type: application/json" -d "{\"name\":\"Folha de pagamento\"}"`
- DELETE /payment-types/:id  
  Ex.: `curl -X DELETE http://localhost:3333/payment-types/1`

### /payments

- GET /payments  
  Com filtros: `curl "http://localhost:3333/payments?paymentTypeId=1&startDate=2025-01-01&endDate=2025-01-31"`
- GET /payments/:id  
  Ex.: `curl http://localhost:3333/payments/1`
- GET /payments/report  
  Retorna `{ payments: Payment[], total: number }`.  
  Ex.: `curl "http://localhost:3333/payments/report?startDate=2025-01-01&endDate=2025-01-31"`
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
  Ex.: `curl -X DELETE http://localhost:3333/payments/1`
- POST /payments/:id/receipt  
  Envie/substitua comprovante (PDF/JPG/PNG).
  ```bash
  curl -X POST http://localhost:3333/payments/1/receipt \
    -H "Content-Type: multipart/form-data" \
    -F "file=@comprovante.pdf"
  ```
  Responde `{ payment, receiptUrl }`. Se `BUCKET_PRIVADO=true`, a URL é assinada (1h).
- DELETE /payments/:id/receipt  
  Remove comprovante (S3 + banco).

---

## Testes rápidos de API (curl)

- Criar tipo: `curl -X POST http://localhost:3333/payment-types -H "Content-Type: application/json" -d '{"name":"Combustivel"}'`
- Criar pagamento: `curl -X POST http://localhost:3333/payments -H "Content-Type: application/json" -d '{"date":"2025-01-20","paymentTypeId":1,"description":"Pagamento","amount":150}'`
- Enviar comprovante: `curl -X POST http://localhost:3333/payments/1/receipt -F "file=@/caminho/arquivo.pdf"`
- Remover comprovante: `curl -X DELETE http://localhost:3333/payments/1/receipt`
- Relatório: `curl "http://localhost:3333/payments/report?startDate=2025-01-01&endDate=2025-01-31"`

---

## Testes automatizados

- Unitários com Vitest cobrindo regras de pagamento e tipos (`src/services/__tests__`), mockando repositórios e S3. Não dependem de MySQL nem de credenciais AWS.
- Rodar localmente no backend: `npm test`. (Os testes não estão configurados para rodar via container ou E2E.)

---

## Frontend - Funcionalidades

- Listagem de pagamentos
- Filtros por tipo e período
- Relatório por período (total + lista)
- Criação, edição e exclusão de pagamentos
- CRUD de tipos com tabela dedicada
- Upload/substituição/remoção de comprovante a partir da tabela
- Formatação de datas/valores e selects dinâmicos

---

## Validações e regras de negócio

- Celebrate/Joi em body/query/params.
- Regras: normalização de data/descrição/valor; não permitir duplicados (data+tipo+descrição+valor); checagem de FK; tipos com nome único; 404 para não encontrados.

---

## O que foi implementado

- API completa de pagamentos e tipos (CRUD + filtros)
- Seeds dos tipos sugeridos
- Relatório por período com totalizador
- Upload de comprovante com Multer + S3 (substituir/remover)
- Regra de não-duplicidade e checagem de FK
- Validações com Celebrate/Joi
- Frontend com CRUD, filtros, relatório e gestão de comprovantes
- Docker/docker-compose
- README atualizado com .env e exemplos
- Testes unitários de serviços com Vitest

---

## O que eu faria se tivesse mais tempo

- Reestruturar o frontend separando page.tsx em componentes menores
- Ampliar cobertura de testes (integração/E2E) e automatizar execução em container
- Criar migrations no TypeORM e remover `synchronize: true`

---

## Limitações conhecidas

- Testes apenas unitários de serviços; sem integração/E2E
- TypeORM usa `synchronize: true`; sem migrations
