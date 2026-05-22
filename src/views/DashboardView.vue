<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const customers = ref([])
const sales = ref([])
const products = ref([])
const creditRules = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [c, s, p, r] = await Promise.all([
      api.get('/customers'),
      api.get('/sales'),
      api.get('/products'),
      api.get('/credit_rules'),
    ])
    customers.value = c.data
    sales.value = s.data
    products.value = p.data
    creditRules.value = r.data
  } finally {
    loading.value = false
  }
})

function totalSales() {
  return sales.value.reduce((sum, s) => sum + s.total, 0)
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function totalCredits() {
  return customers.value.reduce((sum, c) => sum + (c.available_credits || 0), 0)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Olá, {{ auth.user?.name?.split(' ')[0] }}!</h2>
        <p>Resumo do seu programa de fidelidade</p>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:48px">
      <span class="spinner dark" style="width:32px;height:32px" />
    </div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-label">Total em Vendas</div>
          <div class="stat-value">{{ formatCurrency(totalSales()) }}</div>
          <div class="stat-sub">{{ sales.length }} venda{{ sales.length !== 1 ? 's' : '' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Clientes</div>
          <div class="stat-value">{{ customers.length }}</div>
          <div class="stat-sub">cadastrados</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Produtos</div>
          <div class="stat-value">{{ products.length }}</div>
          <div class="stat-sub">no catálogo</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Créditos Distribuídos</div>
          <div class="stat-value">{{ totalCredits() }}</div>
          <div class="stat-sub">pontos em circulação</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3>Últimas Vendas</h3>
            <RouterLink to="/sales" class="btn btn-ghost btn-sm">Ver todas</RouterLink>
          </div>
          <div v-if="sales.length === 0" class="empty-state" style="padding:32px">
            <p>Nenhuma venda ainda</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>Cliente</th><th>Data</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr v-for="sale in sales.slice(0, 6)" :key="sale.id">
                  <td>{{ sale.customer_name }}</td>
                  <td>{{ formatDate(sale.sale_date) }}</td>
                  <td><strong>{{ formatCurrency(sale.total) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Top Clientes por Créditos</h3>
            <RouterLink to="/customers" class="btn btn-ghost btn-sm">Ver todos</RouterLink>
          </div>
          <div v-if="customers.length === 0" class="empty-state" style="padding:32px">
            <p>Nenhum cliente ainda</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>Cliente</th><th>Créditos</th></tr>
              </thead>
              <tbody>
                <tr v-for="c in [...customers].sort((a,b) => b.available_credits - a.available_credits).slice(0,6)" :key="c.id">
                  <td>{{ c.name }}</td>
                  <td><span class="credits-pill">{{ c.available_credits }} pts</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="creditRules.length" class="card" style="margin-top:20px">
        <div class="card-header">
          <h3>Regras de Crédito Ativas</h3>
          <RouterLink to="/credit-rules" class="btn btn-ghost btn-sm">Gerenciar</RouterLink>
        </div>
        <div class="card-body" style="display:flex;flex-wrap:wrap;gap:10px">
          <div v-for="rule in creditRules" :key="rule.id" style="background:var(--cream-100);border:1px solid var(--cream-200);border-radius:8px;padding:12px 16px;font-size:13px">
            <div style="font-weight:700;color:var(--red-600)">{{ rule.credit_amount }} créditos</div>
            <div style="color:var(--text-muted);margin-top:2px">a cada R$ {{ rule.spend_amount }} gastos</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
