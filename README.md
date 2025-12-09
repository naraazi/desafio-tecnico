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
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=sua_chave_jwt_segura_aqui
JWT_EXPIRES_IN=1d
JWT_MAX_AGE_MS=86400000
AUTH_COOKIE_NAME=auth_token
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
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
# criar usuarios admin/operator
npm run user:create
```

Frontend (`frontend/.env`):

```
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_AUTH_COOKIE_NAME=auth_token
JWT_SECRET=mesma_chave_jwt_do_backend
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

Para o docker-compose receber as credenciais adequadas, crie um `.env` na raiz do projeto (mesmo nível do `docker-compose.yml`).

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

Usuários não são criados automaticamente. Crie admin/operator manualmente com:

```
cd backend
npm run user:create
```

---

## API - Endpoints disponíveis e exemplos

### /auth (todas via cookie HttpOnly)

- POST /auth/login  
  Body: `{ "email": "admin@email.com", "password": "sua_senha" }`  
  Gera cookie `auth_token` HttpOnly.
- GET /auth/me  
  Retorna usuário autenticado e papel (admin/operator).
- POST /auth/logout  
  Limpa o cookie de sessão.

> Todas as demais rotas requerem estar autenticado via cookie ou Bearer.

### /payment-types

- Rotas POST/PUT/DELETE requerem role `admin`.

- GET /payment-types  
  Ex.: `curl http://localhost:3333/payment-types`
- POST /payment-types  
  Body: `{ "name": "Combustivel" }`
- PUT /payment-types/:id  
  Ex.: `curl -X PUT http://localhost:3333/payment-types/1 -H "Content-Type: application/json" -d "{\"name\":\"Folha de pagamento\"}"`
- DELETE /payment-types/:id  
  Ex.: `curl -X DELETE http://localhost:3333/payment-types/1`

### /payments

- GET/GET:report acessíveis a `admin` e `operator`. Demais rotas (POST/PUT/DELETE, upload/remover recibo) requerem `admin`.

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

- Login (gera cookie HttpOnly):  
  `curl -i -c cookies.txt -X POST http://localhost:3333/auth/login -H "Content-Type: application/json" -d '{"email":"admin@email.com","password":"sua_senha"}'`

- Como admin (CRUD completo usando cookie):  
  - Criar tipo: `curl -b cookies.txt -X POST http://localhost:3333/payment-types -H "Content-Type: application/json" -d '{"name":"Combustivel"}'`
  - Criar pagamento: `curl -b cookies.txt -X POST http://localhost:3333/payments -H "Content-Type: application/json" -d '{"date":"2025-01-20","paymentTypeId":1,"description":"Pagamento","amount":150}'`
  - Editar pagamento: `curl -b cookies.txt -X PUT http://localhost:3333/payments/1 -H "Content-Type: application/json" -d '{"description":"Ajuste","amount":120}'`
  - Deletar pagamento: `curl -b cookies.txt -X DELETE http://localhost:3333/payments/1`
  - Upload de comprovante: `curl -b cookies.txt -X POST http://localhost:3333/payments/1/receipt -F "file=@/caminho/arquivo.pdf"`
  - Remover comprovante: `curl -b cookies.txt -X DELETE http://localhost:3333/payments/1/receipt`

- Como operador (somente leitura; escritas retornam 403):  
  - Login operador: `curl -i -c cookies-op.txt -X POST http://localhost:3333/auth/login -H "Content-Type: application/json" -d '{"email":"operator@email.com","password":"senha"}'`
  - Listar pagamentos: `curl -b cookies-op.txt "http://localhost:3333/payments?startDate=2025-01-01&endDate=2025-01-31"`
  - Tentar criar (esperado 403): `curl -b cookies-op.txt -X POST http://localhost:3333/payments -H "Content-Type: application/json" -d '{"date":"2025-01-20","paymentTypeId":1,"description":"Pago","amount":10}'`

- Relatório (qualquer autenticado):  
  `curl -b cookies.txt "http://localhost:3333/payments/report?startDate=2025-01-01&endDate=2025-01-31"`

---

## Testes automatizados

- Unitários com Vitest (apenas backend). Não dependem de MySQL nem de credenciais AWS; repositórios, S3, JWT e req/res são mockados.
- Cobertura:
  - `src/services/__tests__/PaymentService.spec.ts`: normalização de dados, bloqueio de duplicados, checagem de FK, totalização de relatórios e remoção de comprovante/S3.
  - `src/services/__tests__/PaymentTypeService.spec.ts`: criação/edição/deleção de tipos com validação de duplicidade e bloqueio quando o tipo está em uso.
  - `src/services/__tests__/AuthService.spec.ts`: login com credenciais válidas, erro de credenciais, erro quando `JWT_SECRET` ausente, criação de usuário e sanitização (passwordHash não vaza).
  - `src/middlewares/__tests__/auth.spec.ts`: `requireAuth` (cookie/Bearer, token inválido/ausente) e `requireRole` (RBAC admin/operator).
- Como rodar: no diretório `backend`, execute `npm run test`. A saída não deve conectar a banco nem AWS; tudo é mockado.

---

## Frontend - Funcionalidades

- Listagem de pagamentos
- Filtros por tipo e período
- Relatório por período (total + lista)
- Criação, edição e exclusão de pagamentos
- CRUD de tipos com tabela dedicada
- Upload/substituição/remoção de comprovante a partir da tabela
- Formatação de datas/valores e selects dinâmicos
- Tela de login e proteção de rotas via middleware (RBAC admin/operator; operadores têm UI somente leitura)

---

## Validações e regras de negócio

- Celebrate/Joi em body/query/params.
- Regras: normalização de data/descrição/valor; não permitir duplicados (data+tipo+descrição+valor); checagem de FK; tipos com nome único; 404 para não encontrados.
- RBAC: rotas sensíveis requerem `admin`; consultas podem ser feitas por `operator`.

---

## O que foi implementado

- API completa de pagamentos e tipos (CRUD + filtros)
- Seeds dos tipos sugeridos
- Relatório por período com totalizador
- Upload de comprovante com Multer + S3 (substituir/remover)
- Regra de não-duplicidade e checagem de FK
- Validações com Celebrate/Joi
- Autenticação via JWT em cookie HttpOnly + RBAC (admin/operator) protegendo API e UI (Next middleware)
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
