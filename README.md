# Desafio Técnico – Sistema de Controle de Pagamentos

Sistema para cadastro e consulta de pagamentos de um cartório, desenvolvido como desafio técnico para vaga de Desenvolvedor Web Pleno.

O projeto é dividido em dois módulos:

- **backend/** – API REST em Node.js + TypeScript + Express + TypeORM + MySQL
- **frontend/** – Interface web em Next.js (App Router) + React, consumindo a API via `fetch`

> Este README está atualizado para refletir o estado **real** do código do projeto.

---

## Sumário

1. Tecnologias utilizadas
2. Estrutura do projeto
3. Como rodar o projeto
4. Modelo de dados
5. API – Endpoints disponíveis
6. Frontend – Funcionalidades
7. Validações e regras de negócio
8. O que foi implementado
9. O que eu faria se tivesse mais tempo
10. Limitações conhecidas

---

## Tecnologias utilizadas

### Backend

- Node.js
- TypeScript
- Express
- TypeORM
- MySQL
- Celebrate / Joi (validações)
- dotenv

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Fetch API (para chamadas HTTP)

> Observação: embora algumas versões anteriores do README mencionassem **Axios**, o frontend atual utiliza **apenas `fetch`** para consumo da API, sem dependência de Axios.

---

## Estrutura do projeto

backend/src contendo controllers, services, entities, routes, database, validations.

frontend/app contendo page.tsx e layout.tsx.

---

## Como rodar o projeto

### Pré-requisitos

- Node.js
- MySQL
- npm ou yarn

---

### Configuração do banco de dados

Crie um banco:

CREATE DATABASE cartorio_payments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

---

### Backend

Crie backend/.env:

DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=cartorio_payments
APP_PORT=3333

Rode:

npm install
npm run dev

---

### Frontend

Crie frontend/.env.local:

NEXT_PUBLIC_API_URL=http://localhost:3333

Rode:

npm install
npm run dev

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

## API – Endpoints disponíveis

### /payment-types

GET /payment-types  
POST /payment-types

> OBS: Rota DELETE /payment-types/:id ainda **não** implementada no backend.

---

### /payments

GET /payments  
GET /payments/:id  
POST /payments  
PUT /payments/:id  
DELETE /payments/:id

Filtros disponíveis no GET /payments:

- paymentTypeId
- startDate
- endDate

---

## Frontend – Funcionalidades

- Listagem de pagamentos
- Filtro por tipo e período
- Criação e edição de pagamentos
- Exclusão de pagamentos
- Carregamento dinâmico dos tipos (somente listagem)
- Formatação de datas e valores

> OBS: Tela de CRUD para tipos de pagamento ainda **não** existe.

---

## Validações e regras de negócio

- Celebrate/Joi no backend valida:
  - criação de pagamento
  - edição de pagamento
  - filtros de listagem
  - criação de tipo de pagamento
- Regras implementadas:
  - Normalização de data
  - Normalização de descrição
  - Normalização do valor
  - Proibição de pagamentos duplicados (mesma data + tipo + descrição + valor)

---

## O que foi implementado

- API completa de pagamentos (CRUD + filtros)
- Regra de não-duplicidade
- Validações com celebrate/Joi
- Frontend funcional com criação, edição, exclusão e filtros
- Modelo de dados conforme o LEAD
- Documentação atualizada deste README

---

## O que eu faria se tivesse mais tempo

- Implementaria CRUD completo de tipos de pagamento (incluindo DELETE e tela dedicada)
- Criaria página e endpoint de relatório (`/payments/report`) com total por período
- Adicionaria upload de comprovantes usando Multer
- Adicionaria Docker e docker-compose para subir ambiente completo
- Reestruturaria o frontend separando page.tsx em componentes menores
- Implementaria testes automatizados (Jest ou Vitest)
- Criaria migrations no TypeORM e removeria `synchronize: true`

---

## Limitações conhecidas

- Backend não valida params de rota (ex.: id em /payments/:id)
- Falta CRUD completo para tipos
- Falta área administrativa para gerenciar tipos
- Falta features diferenciais (Docker, testes, upload, relatórios)
