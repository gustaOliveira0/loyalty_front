# Loyalty Frontend

Frontend do sistema de programa de fidelidade, desenvolvido com Vue 3 Composition API.

## Stack

- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Vue Router 4
- Axios
- qrcode (geração de QR Code)

## Funcionalidades

- Autenticação (login / cadastro)
- Dashboard com resumo de vendas e clientes
- Gestão de clientes com créditos
- Registro de vendas (créditos calculados automaticamente)
- Catálogo de produtos por categoria
- Regras de crédito configuráveis
- Geração e download de QR Code para cadastro de clientes
- Formulário público de auto-cadastro via QR Code (mobile-first)

## Setup

```bash
cp .env.example .env
# Edite o .env com a URL do backend
npm install
npm run dev
```

## Variáveis de ambiente

```
VITE_API_URL=http://108.174.151.220/api/v1
```

## Backend

Requer o loyalty_backend rodando na porta 3000.
