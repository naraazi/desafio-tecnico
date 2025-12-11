# Desafio Técnico - Sistema de Pagamentos e Transferências

Aplicação full-stack para controle de pagamentos e transferências do cartório: API REST em Node.js/TypeScript/Express/TypeORM (MySQL) e frontend em Next.js (App Router). Inclui autenticação JWT via cookie HttpOnly, RBAC admin/operator, upload de comprovantes para S3, filtros com paginação/ordenação, relatório por período e testes automatizados.

## Sumário
- Tecnologias e stack
- Estrutura do repositório
- Como rodar (local e Docker)
- Variáveis de ambiente
- Modelo de dados e regras de negócio
- Autenticação e perfis
- API - Endpoints disponíveis e exemplos
- Testes rápidos de API (curl)
- Testes automatizados
- Seeds e scripts auxiliares
- Limitações conhecidas

## Tecnologias e stack
- Backend: Node.js 20+, TypeScript, Express 5, TypeORM (MySQL), Celebrate/Joi (validações), Multer (upload), AWS S3, dotenv, Vitest.
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Fetch API, Vitest + Testing Library + MSW.
- Infra: Docker e Docker Compose.

## Estrutura do repositório
- backend/  API REST (controllers, services, repositories, entities, middlewares, validations, scripts, testes).
- frontend/ Interface Next.js (components, pages, utils, estilos, testes).
- docker-compose.yml  Sobe db (MySQL), backend e frontend. MySQL fica exposto em 3307 no host.

## Como rodar
### Ambiente local
Pré-requisitos: Node.js 20+, npm, MySQL em execução, credenciais AWS se for usar upload de comprovante.

Crie `backend/.env` (ajuste valores conforme seu ambiente):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=cartorio_payments
APP_PORT=3333
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=chave_jwt_segura_aqui
JWT_EXPIRES_IN=1d
JWT_MAX_AGE_MS=86400000
AUTH_COOKIE_NAME=auth_token
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
S3_BUCKET=seu_bucket_s3
BUCKET_PRIVADO=true
```

Backend:
```
cd backend
npm install
npm run dev
# criar usuário admin/operator
npm run user:create
```

Frontend (`frontend/.env`):
```
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_AUTH_COOKIE_NAME=auth_token
```
```
cd frontend
npm install
npm run dev
```

### Docker / docker-compose
Pré-requisitos: Docker + Docker Compose.

1) Crie um `.env` na raiz (mesmo nível do `docker-compose.yml`) para preencher as variáveis usadas pelos serviços. Exemplo mínimo:
```
JWT_SECRET=chave_jwt_segura_aqui
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
S3_BUCKET=seu_bucket_s3
AWS_REGION=sa-east-1
BUCKET_PRIVADO=true
AUTH_COOKIE_NAME=auth_token
JWT_EXPIRES_IN=1d
JWT_MAX_AGE_MS=86400000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```
2) Suba tudo:
```
docker-compose up -d --build
```
- API: http://localhost:3333
- Frontend: http://localhost:3000
- MySQL: porta 3307 no host (usuário/senha `cartorio` por padrão).

Para criar usuários dentro do container do backend após o build:
```
docker compose exec backend node dist/scripts/createUser.js
```

## Variáveis de ambiente
- Autenticação: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_MAX_AGE_MS`, `AUTH_COOKIE_NAME`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN` (opcional).
- CORS/frontend: `FRONTEND_URL`, `CORS_ORIGINS` (lista separada por vírgula).
- Banco: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
- S3/comprovantes: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `BUCKET_PRIVADO` (true gera URL assinada de 1h; false deixa público). Upload exige bucket/config válidos e aceita PDF/PNG/JPG até 5MB.

## Modelo de dados e regras de negócio
- PaymentType: id, name, createdAt, updatedAt.
- Payment: id, date, paymentTypeId (FK), transactionType (`payment` ou `transfer`), description, amount (decimal 10,2), receiptPath (opcional), receiptUrl (virtual), createdAt, updatedAt.
- Duplicidade bloqueada por índice único: date + paymentTypeId + description + amount + transactionType.
- Validações: Celebrate/Joi em body/query/params (datas ISO, valores positivos, tamanhos de string, tipos permitidos, paginação com limite 100, sort whitelist).
- Upload: PDF/PNG/JPG até 5MB; bucket privado gera URL assinada de 1h; bucket público usa URL direta.
- Seeds: tipos padrão são inseridos na subida do backend se não existirem (Folha de pagamento, Combustível, Estorno, Manutenção predial).

## Autenticação e perfis
- JWT assinado com cookie HttpOnly (`auth_token` por padrão). Todas as rotas após `/auth/login` exigem autenticação.
- Perfis: `admin` (CRUD completo de tipos e pagamentos, upload/remoção de comprovantes) e `operator` (leitura/listagens/relatório).
- Frontend guarda sessão via cookie e valida em `/auth/me`; a checagem definitiva está na API.

## API - Endpoints disponíveis e exemplos
Todas as rotas abaixo exigem cookie `auth_token` válido ou header `Authorization: Bearer <token>`, exceto o login.

### /auth
- POST `/auth/login`
  - Body: `{ "email": "admin@email.com", "password": "sua_senha" }`
  - Gera cookie HttpOnly. Resposta: `{ user: { id, name, email, role } }`.
- GET `/auth/me`
  - Retorna usuário autenticado e papel. Ex.: `{ user: { id, name, email, role } }`.
- POST `/auth/logout`
  - Limpa cookie de sessão.

### /payment-types (auth obrigatória)
- GET `/payment-types`  Lista todos os tipos.
- POST `/payment-types` (admin)  Body: `{ "name": "Combustivel" }`.
- PUT `/payment-types/:id` (admin)  Body: `{ "name": "Folha de pagamento" }`.
- DELETE `/payment-types/:id` (admin).

### /payments (auth obrigatória; escrita só admin)
- GET `/payments`
  - Filtros: `paymentTypeId`, `transactionType` (payment/transfer), `startDate`, `endDate`, `search` (descrição ou nome do tipo), `page` (default 1), `pageSize` (max 100), `sortBy` (`date`, `amount`, `description`, `paymentType`, `transactionType`, `createdAt`), `sortOrder` (`asc|desc`).
  - Resposta:
```
{
  "payments": [{ "id": 1, "date": "2025-01-20", "paymentType": { ... }, "transactionType": "payment", "description": "...", "amount": 15000.50, "receiptUrl": "..." }],
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5 },
  "totals": { "pageAmount": 1234.56, "overallAmount": 9876.54 },
  "sort": { "sortBy": "date", "sortOrder": "DESC" }
}
```
- GET `/payments/:id`  Detalhe de um lançamento.
- GET `/payments/report`
  - Mesmo conjunto de filtros (sem paginação). Retorna `{ payments: [...], total: 999.99 }` ordenado por data desc.
- POST `/payments` (admin)
  - Body:
```
{
  "date": "2025-01-20",
  "paymentTypeId": 1,
  "transactionType": "transfer",
  "description": "Pagamento de folha - jan/2025",
  "amount": 15000.50
}
```
  - `transactionType` default `payment` se omitido.
- PUT `/payments/:id` (admin)
  - Body igual ao POST (transactionType obrigatório na atualização).
- DELETE `/payments/:id` (admin).
- POST `/payments/:id/receipt` (admin)
  - Multipart `file=@comprovante.pdf` (PDF/PNG/JPG, max 5MB). Resposta: `{ payment, receiptUrl }`. Com bucket privado, `receiptUrl` é assinada por 1h.
- DELETE `/payments/:id/receipt` (admin)  Remove do S3 e zera `receiptPath`.

Erros comuns: 401/403 para falta de autenticação/permissão, 404 para registros inexistentes, 409 para duplicidade de pagamento (data+tipo+descrição+valor+transactionType), 400 para validação ou tipo de arquivo inválido.

## Testes rápidos de API (curl)
### Login e sessão (admin)
```
curl -i -c cookies.txt -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@email.com","password":"sua_senha"}'
```
### CRUD de tipos (admin)
```
# criar tipo
curl -b cookies.txt -X POST http://localhost:3333/payment-types \
  -H "Content-Type: application/json" \
  -d '{"name":"Combustivel"}'

# listar
curl -b cookies.txt http://localhost:3333/payment-types
```
### Pagamentos (admin)
```
# criar pagamento/transferência
curl -b cookies.txt -X POST http://localhost:3333/payments \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-20","paymentTypeId":1,"transactionType":"transfer","description":"Pagamento","amount":150}'

# listar com filtros, paginação e ordenação
curl -b cookies.txt "http://localhost:3333/payments?paymentTypeId=1&transactionType=transfer&startDate=2025-01-01&endDate=2025-01-31&page=1&pageSize=10&sortBy=amount&sortOrder=desc"

# relatório (qualquer autenticado)
curl -b cookies.txt "http://localhost:3333/payments/report?startDate=2025-01-01&endDate=2025-01-31"

# upload de comprovante (PDF/JPG/PNG até 5MB)
curl -b cookies.txt -X POST http://localhost:3333/payments/1/receipt \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/caminho/arquivo.pdf"

# remover comprovante
curl -b cookies.txt -X DELETE http://localhost:3333/payments/1/receipt
```
### Permissões (operator)
```
# login operador
curl -i -c cookies-op.txt -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@email.com","password":"senha"}'

# leitura permitida
curl -b cookies-op.txt "http://localhost:3333/payments?transactionType=payment"

# tentativa de escrita (retorna 403)
curl -b cookies-op.txt -X POST http://localhost:3333/payments \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-20","paymentTypeId":1,"transactionType":"payment","description":"Pago","amount":10}'
```

## Testes automatizados
- Backend: `cd backend && npm run test` (Vitest). Testes unitários de serviços (pagamentos, tipos, auth), middlewares (`requireAuth`, `requireRole`), mocks para repositórios/S3/JWT/req-res. Não acessa MySQL nem AWS.
- Frontend: `cd frontend && npm run test` (Vitest + Testing Library + MSW). Testes de componentes (`FiltersPanel`, `PaymentForm`, `PaymentsTable`, `SessionTopbar`) e utils de formatação.

## Seeds e scripts auxiliares
- Seeds automáticos: tipos iniciais são inseridos ao iniciar o backend se não existirem.
- Usuários: não há seed automático. Crie via scripts:
  - Local: `cd backend && npm run user:create` (usa ts-node-dev).
  - Docker: `docker compose exec backend node dist/scripts/createUser.js` (após build). Há também scripts `deleteUser`, `updateUser`, `listUsers` no mesmo padrão.

## Limitações conhecidas
- TypeORM usa `synchronize: true`; não há migrations versionadas.
- Upload de comprovante depende de configurar bucket/credenciais S3 válidas; sem isso, chamadas de upload/remoção retornam erro 500.
- Frontend protege rotas via verificação de sessão no cliente; a segurança efetiva está na API.
