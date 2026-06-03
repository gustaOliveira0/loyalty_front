<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController } from 'chart.js'
import api from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController)

const auth = useAuthStore()
const customers = ref([])
const products = ref([])
const loading = ref(true)
const dashLoading = ref(false)
const dashData = ref(null)
const storeSettings = ref({ cashback_kind: 'points' })

const period = ref('month')
const customStart = ref('')
const customEnd = ref('')

const chartCanvas = ref(null)
let chartInstance = null

const periods = [
  { value: 'day',    label: 'Hoje' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
]

const periodLabel = computed(() => {
  const p = periods.find(x => x.value === period.value)
  return p ? p.label : ''
})

async function loadDashboard() {
  dashLoading.value = true
  let chartData = null
  try {
    const params = { period: period.value }
    if (period.value === 'custom') {
      params.start_date = customStart.value
      params.end_date = customEnd.value
    }
    const { data } = await api.get('/dashboard', { params })
    dashData.value = data
    chartData = data.chart_data
  } finally {
    dashLoading.value = false
  }
  if (chartData?.length) {
    await nextTick()
    renderChart(chartData)
  }
}

async function loadBase() {
  loading.value = true
  try {
    const [c, p, s] = await Promise.all([
      api.get('/customers'),
      api.get('/products'),
      api.get('/store_settings'),
    ])
    customers.value = c.data
    products.value = p.data
    storeSettings.value = s.data
  } finally {
    loading.value = false
  }
}

function renderChart(chartData) {
  if (!chartCanvas.value) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const labels = chartData.map(d => d.label)
  const revenues = chartData.map(d => d.revenue)
  const counts = chartData.map(d => d.sales_count)

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receita (R$)',
          data: revenues,
          backgroundColor: 'rgba(185, 28, 28, 0.75)',
          borderColor: 'rgba(185, 28, 28, 1)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          label: 'Vendas',
          data: counts,
          backgroundColor: 'rgba(185, 28, 28, 0.18)',
          borderColor: 'rgba(185, 28, 28, 0.5)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.datasetIndex === 0) return ` R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              return ` ${ctx.parsed.y} venda${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          type: 'linear', position: 'left',
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { size: 11 },
            callback: v => 'R$ ' + v.toLocaleString('pt-BR')
          }
        },
        y1: {
          type: 'linear', position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 11 }, stepSize: 1 },
          min: 0,
        },
      },
    },
  })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatAmount(v) {
  if (storeSettings.value.cashback_kind === 'money') return formatCurrency(v)
  return `${Math.floor(v || 0)} pts`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function totalCredits() {
  return customers.value.reduce((sum, c) => sum + (c.available_credits || 0), 0)
}

function applyCustom() {
  if (customStart.value && customEnd.value) loadDashboard()
}

watch(period, () => {
  if (period.value !== 'custom') loadDashboard()
})

onMounted(async () => {
  await Promise.all([loadBase(), loadDashboard()])
})
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
      <!-- Cards gerais (todos os tempos) -->
      <div class="stats-grid">
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
          <div class="stat-label">Créditos em circulação</div>
          <div class="stat-value">{{ formatAmount(totalCredits()) }}</div>
          <div class="stat-sub">saldo ativo dos clientes</div>
        </div>
      </div>

      <!-- Seletor de período -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header" style="flex-wrap:wrap;gap:10px">
          <h3 style="margin:0;font-size:15px">Balancete &amp; Gráfico de Vendas</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <button
              v-for="p in periods.filter(x => x.value !== 'custom')"
              :key="p.value"
              class="btn btn-sm"
              :class="period === p.value ? 'btn-primary' : 'btn-ghost'"
              @click="period = p.value"
            >{{ p.label }}</button>
            <button
              class="btn btn-sm"
              :class="period === 'custom' ? 'btn-primary' : 'btn-ghost'"
              @click="period = 'custom'"
            >Personalizado</button>
          </div>
        </div>

        <!-- Filtro personalizado -->
        <div v-if="period === 'custom'" style="padding:12px 20px;border-bottom:1px solid var(--cream-200);display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div>
            <label class="form-label" style="font-size:12px;margin-bottom:4px">De</label>
            <input v-model="customStart" type="date" class="form-input" style="width:160px" />
          </div>
          <div>
            <label class="form-label" style="font-size:12px;margin-bottom:4px">Até</label>
            <input v-model="customEnd" type="date" class="form-input" style="width:160px" />
          </div>
          <button class="btn btn-primary btn-sm" @click="applyCustom" :disabled="!customStart || !customEnd">Aplicar</button>
        </div>

        <!-- Balancete -->
        <div v-if="dashLoading" style="text-align:center;padding:32px"><span class="spinner dark" /></div>
        <template v-else-if="dashData">
          <div style="padding:16px 20px;border-bottom:1px solid var(--cream-200)">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">
              {{ periodLabel }}
              <span v-if="period === 'custom' && customStart && customEnd">
                · {{ formatDate(dashData.period.start_date) }} a {{ formatDate(dashData.period.end_date) }}
              </span>
              <span v-else>
                · {{ formatDate(dashData.period.start_date) }} a {{ formatDate(dashData.period.end_date) }}
              </span>
            </div>
            <div class="stats-grid" style="margin-bottom:0;gap:12px">
              <div class="stat-card primary">
                <div class="stat-label">Receita</div>
                <div class="stat-value">{{ formatCurrency(dashData.summary.total_revenue) }}</div>
                <div class="stat-sub">{{ dashData.summary.total_sales }} venda{{ dashData.summary.total_sales !== 1 ? 's' : '' }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Ticket médio</div>
                <div class="stat-value">{{ formatCurrency(dashData.summary.avg_ticket) }}</div>
                <div class="stat-sub">por venda</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Cashback concedido</div>
                <div class="stat-value">{{ formatAmount(dashData.summary.total_cashback) }}</div>
                <div class="stat-sub">no período</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Novos clientes</div>
                <div class="stat-value">{{ dashData.summary.new_customers }}</div>
                <div class="stat-sub">cadastrados no período</div>
              </div>
            </div>
          </div>

          <!-- Gráfico -->
          <div style="padding:20px">
            <div v-if="dashData.chart_data.length === 0" class="empty-state" style="padding:32px">
              <p>Nenhuma venda no período</p>
            </div>
            <div v-else style="position:relative;height:220px">
              <canvas ref="chartCanvas" />
            </div>
          </div>
        </template>
      </div>

      <!-- Grid inferior -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3>Últimas Vendas</h3>
            <RouterLink to="/sales" class="btn btn-ghost btn-sm">Ver todas</RouterLink>
          </div>
          <div v-if="!dashData || dashData.chart_data.every(d => d.sales_count === 0)" class="empty-state" style="padding:32px">
            <p>Nenhuma venda no período</p>
          </div>
          <div v-else-if="dashData" class="table-wrap">
            <table>
              <thead>
                <tr><th>Data</th><th>Receita</th><th>Vendas</th></tr>
              </thead>
              <tbody>
                <tr v-for="d in [...dashData.chart_data].reverse().filter(d => d.sales_count > 0).slice(0,8)" :key="d.date">
                  <td>{{ formatDate(d.date) }}</td>
                  <td><strong>{{ formatCurrency(d.revenue) }}</strong></td>
                  <td><span class="badge badge-blue">{{ d.sales_count }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Top Clientes por Saldo</h3>
            <RouterLink to="/customers" class="btn btn-ghost btn-sm">Ver todos</RouterLink>
          </div>
          <div v-if="customers.length === 0" class="empty-state" style="padding:32px">
            <p>Nenhum cliente ainda</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>Cliente</th><th>Saldo</th></tr>
              </thead>
              <tbody>
                <tr v-for="c in [...customers].sort((a,b) => b.available_credits - a.available_credits).slice(0,8)" :key="c.id">
                  <td>{{ c.name }}</td>
                  <td><span class="credits-pill">{{ formatAmount(c.available_credits) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
