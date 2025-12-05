# Controle de Pagamentos / Transferências

Aplicação Full Stack desenvolvida como parte de um desafio técnico para vaga de Desenvolvedor Full Stack.  
O projeto inclui backend em **Node.js + TypeScript + TypeORM + MySQL** e frontend em **Next.js + React**.

O sistema permite:

- Cadastro de pagamentos
- Listagem com filtros
- Edição e exclusão
- Prevenção automática de duplicidades
- Visualização clara e organizada dos registros

---

## 🚀 Tecnologias Utilizadas

### **Backend**

- Node.js
- TypeScript
- Express
- TypeORM
- MySQL
- ts-node-dev
- dotenv

### **Frontend**

- Next.js
- React
- Axios

---

## 🗄️ Configuração do Banco de Dados

1. Crie o banco:

```sql
CREATE DATABASE cartorio_payments;
```

2. No backend, crie o arquivo `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=cartorio_payments

PORT=3333
```

---

## 🔧 Como rodar o Backend

```bash
cd backend
npm install
npm run dev
```

Se estiver tudo certo, aparecerá:

```
Conectado banco...
Server running on http://localhost:3333
```

---

## 🖥️ Como rodar o Frontend

```bash
cd frontend
npm install
```

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Depois:

```bash
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

# 📘 Funcionalidades Implementadas

### ✔ Cadastro de pagamentos

Campos: data, tipo, descrição e valor.

### ✔ Listagem de pagamentos

Inclui filtros por:

- Tipo de pagamento
- Data inicial
- Data final

### ✔ Edição

Todos os campos podem ser alterados.

### ✔ Exclusão

Remoção direta via botão na tabela.

### ✔ Cadastro e listagem de tipos de pagamento

Área específica para criação e exclusão de tipos.

---

# ⚠️ Regra de Não Duplicidade

A aplicação impede o cadastro de dois pagamentos idênticos.  
Um pagamento é considerado duplicado se possuir:

- A mesma **data** (formatada como `YYYY-MM-DD`)
- O mesmo **paymentTypeId**
- A mesma **descrição**
- A mesma **valor**

Se uma tentativa duplicada ocorrer, a API retorna:

```json
{
  "message": "Já existe um pagamento com mesma data, tipo, descrição e valor."
}
```

### ✔ Teste realizado com sucesso

- 1ª requisição: **201 Created**
- 2ª requisição idêntica: **400 Bad Request**

Funciona tanto no Thunder Client quanto no frontend.

---

## 📂 Estrutura Geral do Backend

```
src/
 ├─ controllers/
 ├─ services/
 ├─ entities/
 ├─ database/
 ├─ routes/
 └─ server.ts
```

---

## 🌐 Endpoints Principais

### **Tipos de Pagamento**

| Método | Rota               | Descrição      |
| ------ | ------------------ | -------------- |
| GET    | /payment-types     | Lista todos    |
| POST   | /payment-types     | Cria novo tipo |
| DELETE | /payment-types/:id | Remove tipo    |

### **Pagamentos**

| Método | Rota          | Descrição           |
| ------ | ------------- | ------------------- |
| GET    | /payments     | Lista com filtros   |
| POST   | /payments     | Cria um pagamento   |
| PUT    | /payments/:id | Edita um pagamento  |
| DELETE | /payments/:id | Remove um pagamento |

---

## 🧪 Testes Manuais Realizados

### Backend

- Criação de pagamentos
- Edição e exclusão
- Filtros funcionais
- Regra de duplicidade validada
- Datas normalizadas
- Relacionamentos funcionando

### Frontend

- Formulário funcionando
- Listagem atualizada em tempo real
- Filtros por tipo e datas
- Edição e exclusão corretas
- Integração total com o backend

---

## ✔ Conclusão

O sistema atende **todos os requisitos do desafio técnico**, oferecendo:

- Backend sólido e organizado
- Frontend intuitivo
- Fluxo completo de CRUD
- Regra de duplicidade funcionando
- Banco de dados relacional integrado
- Código limpo e estruturado

Projeto pronto para entrega e avaliação.
