<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const rules = ref([])
const loading = ref(true)
const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref(null)
const deleting = ref(null)
const saving = ref(false)
const error = ref('')
const form = ref({ spend_amount: '', credit_amount: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/credit_rules')
    rules.value = data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { spend_amount: '', credit_amount: '' }
  error.value = ''
  showModal.value = true
}

function openEdit(r) {
  editing.value = r
  form.value = { spend_amount: r.spend_amount, credit_amount: r.credit_amount }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await api.patch(`/credit_rules/${editing.value.id}`, form.value)
    } else {
      await api.post('/credit_rules', form.value)
    }
    showModal.value = false
    await load()
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? errs.join(', ') : (e.response?.data?.error || 'Erro ao salvar')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  try {
    await api.delete(`/credit_rules/${deleting.value.id}`)
  } finally {
    showDeleteModal.value = false
    await load()
  }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Regras de Crédito</h2>
        <p>Defina quanto crédito o cliente ganha por compra</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Regra
      </button>
    </div>

    <div class="card" style="margin-bottom:20px;background:var(--cream-100);border-color:var(--cream-300)">
      <div class="card-body" style="font-size:13px;color:var(--text-medium)">
        <strong style="color:var(--red-700)">Como funciona:</strong>
        Ao registrar uma venda, o sistema usa a regra de maior valor de gasto para calcular:
        <code style="background:var(--cream-200);padding:2px 6px;border-radius:4px;font-size:12px">créditos = floor(total ÷ gasto) × créditos_da_regra</code>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Regras cadastradas</h3>
        <span class="badge badge-gray">{{ rules.length }} regra{{ rules.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

      <div v-else-if="rules.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <p>Nenhuma regra de crédito</p>
        <span>Crie uma regra para começar a distribuir créditos</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>A cada (gasto)</th><th>Ganha (créditos)</th><th>Descrição</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td><strong style="color:var(--red-700)">{{ formatCurrency(rule.spend_amount) }}</strong></td>
              <td>
                <span class="credits-pill">{{ rule.credit_amount }} pts</span>
              </td>
              <td style="font-size:13px;color:var(--text-muted)">{{ rule.description }}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-ghost btn-sm" @click="openEdit(rule)">Editar</button>
                  <button class="btn btn-danger btn-sm" @click="deleting = rule; showDeleteModal = true">Remover</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3>{{ editing ? 'Editar Regra' : 'Nova Regra de Crédito' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Gasto mínimo (R$) *</label>
                <input v-model="form.spend_amount" type="number" step="0.01" min="0.01" class="form-input" placeholder="Ex: 100" />
                <div class="form-error" style="color:var(--text-muted);font-size:11px;margin-top:4px">A cada R$ X gastos</div>
              </div>
              <div class="form-group">
                <label class="form-label">Créditos ganhos *</label>
                <input v-model="form.credit_amount" type="number" min="1" step="1" class="form-input" placeholder="Ex: 10" />
                <div class="form-error" style="color:var(--text-muted);font-size:11px;margin-top:4px">O cliente ganha X créditos</div>
              </div>
            </div>
            <div v-if="form.spend_amount && form.credit_amount" style="background:var(--cream-100);border-radius:8px;padding:12px;font-size:13px;color:var(--text-medium);margin-top:4px">
              Preview: A cada <strong>R$ {{ form.spend_amount }}</strong> gastos, o cliente ganha <strong>{{ form.credit_amount }} créditos</strong>.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showModal = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner" />
              <span v-else>{{ editing ? 'Salvar' : 'Criar Regra' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal" style="max-width:360px">
          <div class="modal-header">
            <h3>Remover regra</h3>
            <button class="modal-close" @click="showDeleteModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="color:var(--text-medium)">Remover a regra de <strong>R$ {{ deleting?.spend_amount }}</strong> → <strong>{{ deleting?.credit_amount }} créditos</strong>?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showDeleteModal = false">Cancelar</button>
            <button class="btn btn-primary" style="background:var(--red-600)" @click="confirmDelete">Remover</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
