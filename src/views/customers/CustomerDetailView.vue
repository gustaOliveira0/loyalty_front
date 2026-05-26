<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/index.js'

const route = useRoute()
const router = useRouter()
const data = ref(null)
const loading = ref(true)
const error = ref('')

const showRedeem = ref(false)
const redeemAmount = ref('')
const redeemError = ref('')
const redeeming = ref(false)

async function load() {
  loading.value = true
  try {
    const { data: d } = await api.get(`/customers/${route.params.id}/statement`)
    data.value = d
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao carregar extrato'
  } finally {
    loading.value = false
  }
}

const unit = computed(() => data.value?.unit || 'points')

function formatAmount(v, kind = unit.value) {
  if (kind === 'money') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  return `${Math.floor(v || 0)} pts`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

function kindLabel(kind) {
  return { earn: 'Crédito', redeem: 'Resgate', expire: 'Expirado', adjust: 'Ajuste' }[kind] || kind
}

function kindClass(kind) {
  return {
    earn: 'badge badge-blue',
    redeem: 'badge badge-gray',
    expire: 'badge badge-gray',
    adjust: 'badge badge-gray'
  }[kind] || 'badge badge-gray'
}

async function doRedeem() {
  redeemError.value = ''
  redeeming.value = true
  try {
    await api.post(`/customers/${route.params.id}/redeem`, { amount: redeemAmount.value })
    showRedeem.value = false
    redeemAmount.value = ''
    await load()
  } catch (e) {
    const errs = e.response?.data?.errors
    redeemError.value = errs ? errs.join(', ') : 'Erro no resgate'
  } finally {
    redeeming.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <button class="btn btn-ghost btn-sm" @click="router.back()" style="margin-bottom:8px">← Voltar</button>
        <h2 v-if="data">{{ data.customer.name }}</h2>
        <p v-if="data">Extrato de fidelidade</p>
      </div>
      <button v-if="data && data.balance > 0" class="btn btn-primary" @click="showRedeem = true">Resgatar cashback</button>
    </div>

    <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else-if="data">
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card primary">
          <div class="stat-label">Saldo disponível</div>
          <div class="stat-value">{{ formatAmount(data.balance) }}</div>
          <div v-if="data.min_redeem > 0" class="stat-sub">Mínimo para resgate: {{ formatAmount(data.min_redeem) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total acumulado</div>
          <div class="stat-value">{{ formatAmount(data.earned_total) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Já resgatado</div>
          <div class="stat-value">{{ formatAmount(data.redeemed_total) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Expirado</div>
          <div class="stat-value">{{ formatAmount(data.expired_total) }}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3 style="margin:0;font-size:16px">Compras</h3></div>
        <div v-if="data.purchases.length === 0" class="empty-state"><p>Sem compras registradas</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Itens</th><th>Total</th><th>Cashback</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in data.purchases" :key="s.id">
                <td>{{ formatDate(s.sale_date) }}</td>
                <td style="font-size:13px;color:var(--text-medium)">
                  <div v-for="(i, k) in s.items" :key="k">
                    {{ i.quantity }}× {{ i.product_name }}
                  </div>
                </td>
                <td><strong>{{ formatAmount(s.total, 'money') }}</strong></td>
                <td><span class="credits-pill">+ {{ formatAmount(s.cashback_earned) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="margin:0;font-size:16px">Movimentações</h3></div>
        <div v-if="data.transactions.length === 0" class="empty-state"><p>Sem movimentações</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr><th>Tipo</th><th>Descrição</th><th>Quando</th><th>Vence</th><th>Valor</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in data.transactions" :key="t.id">
                <td><span :class="kindClass(t.kind)">{{ kindLabel(t.kind) }}</span></td>
                <td style="color:var(--text-medium)">{{ t.description || '—' }}</td>
                <td>{{ formatDateTime(t.created_at) }}</td>
                <td>{{ t.expires_at ? formatDate(t.expires_at) : '—' }}</td>
                <td>
                  <strong :style="{ color: t.amount >= 0 ? 'var(--red-700)' : 'var(--text-medium)' }">
                    {{ t.amount >= 0 ? '+' : '' }}{{ formatAmount(t.amount) }}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showRedeem" class="modal-backdrop" @click.self="showRedeem = false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>Resgatar cashback</h3>
            <button class="modal-close" @click="showRedeem = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="redeemError" class="alert alert-error">{{ redeemError }}</div>
            <div class="form-group">
              <label class="form-label">Valor ({{ unit === 'money' ? 'R$' : 'pontos' }}) *</label>
              <input v-model="redeemAmount" type="number" step="0.01" min="0" class="form-input" :placeholder="data?.min_redeem ? String(data.min_redeem) : '0'" />
              <small style="color:var(--text-muted);font-size:12px">
                Saldo: {{ formatAmount(data?.balance) }}{{ data?.min_redeem > 0 ? ` · Mínimo: ${formatAmount(data.min_redeem)}` : '' }}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showRedeem = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="redeeming" @click="doRedeem">
              <span v-if="redeeming" class="spinner" />
              <span v-else>Confirmar resgate</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
