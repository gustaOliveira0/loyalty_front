<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/index.js'

const sales = ref([])
const customers = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const saving = ref(false)
const error = ref('')

const form = ref({ customer_id: '', total: '', sale_date: new Date().toISOString().substring(0, 10) })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return sales.value
  return sales.value.filter(s => s.customer_name.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try {
    const [s, c] = await Promise.all([api.get('/sales'), api.get('/customers')])
    sales.value = s.data
    customers.value = c.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = { customer_id: '', total: '', sale_date: new Date().toISOString().substring(0, 10) }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  if (!form.value.customer_id) { error.value = 'Selecione um cliente'; return }
  if (!form.value.total || Number(form.value.total) <= 0) { error.value = 'Informe o valor da venda'; return }
  saving.value = true
  try {
    await api.post('/sales', {
      customer_id: form.value.customer_id,
      total: form.value.total,
      sale_date: form.value.sale_date
    })
    showModal.value = false
    await load()
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? errs.join(', ') : (e.response?.data?.error || 'Erro ao registrar venda')
  } finally {
    saving.value = false
  }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function totalSum() {
  return sales.value.reduce((s, v) => s + v.total, 0)
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Vendas</h2>
        <p>Registre vendas e acumule créditos automaticamente</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Venda
      </button>
    </div>

    <div v-if="!loading" class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card primary">
        <div class="stat-label">Total de Vendas</div>
        <div class="stat-value">{{ formatCurrency(totalSum()) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Quantidade</div>
        <div class="stat-value">{{ sales.length }}</div>
        <div class="stat-sub">vendas registradas</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-wrap" style="flex:1;max-width:320px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="form-input" placeholder="Buscar por cliente..." />
        </div>
      </div>

      <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>{{ search ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada' }}</p>
        <span v-if="!search">Clique em "Nova Venda" para registrar</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Data</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="sale in filtered" :key="sale.id">
              <td><strong>{{ sale.customer_name }}</strong></td>
              <td>{{ formatDate(sale.sale_date) }}</td>
              <td><strong style="color:var(--red-700)">{{ formatCurrency(sale.total) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Nova Venda</h3>
            <button class="modal-close" @click="showModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div class="form-group">
              <label class="form-label">Cliente *</label>
              <select v-model="form.customer_id" class="form-select">
                <option value="">Selecione o cliente</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Valor Total (R$) *</label>
                <input v-model="form.total" type="number" step="0.01" min="0.01" class="form-input" placeholder="0,00" />
              </div>
              <div class="form-group">
                <label class="form-label">Data da Venda</label>
                <input v-model="form.sale_date" type="date" class="form-input" />
              </div>
            </div>
            <div v-if="form.customer_id && form.total" style="background:var(--cream-100);border-radius:8px;padding:12px;font-size:13px;color:var(--text-medium)">
              Os créditos serão calculados automaticamente com base nas suas regras de crédito.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showModal = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner" />
              <span v-else>Registrar Venda</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
