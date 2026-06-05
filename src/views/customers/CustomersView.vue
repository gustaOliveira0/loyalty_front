<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/index.js'
import { useAuthStore } from '../../stores/auth.js'
const auth = useAuthStore()

const router = useRouter()
const customers = ref([])
const storeSettings = ref({ cashback_kind: 'points' })
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref(null)
const deleting = ref(null)
const saving = ref(false)
const error = ref('')

const form = ref({ name: '', birth_date: '', phone_number: '', cpf: '', whatsapp_opt_in: true })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(c =>
    c.name.toLowerCase().includes(q) || c.cpf?.includes(q) || c.phone_number?.includes(q)
  )
})

async function load() {
  loading.value = true
  try {
    const [c, s] = await Promise.all([api.get('/customers'), api.get('/store_settings')])
    customers.value = c.data
    storeSettings.value = s.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', birth_date: '', phone_number: '', cpf: '', whatsapp_opt_in: true }
  error.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    name: c.name,
    birth_date: c.birth_date?.substring(0,10) || '',
    phone_number: c.phone_number || '',
    cpf: c.cpf || '',
    whatsapp_opt_in: c.whatsapp_opt_in !== false
  }
  error.value = ''
  showModal.value = true
}

function openDelete(c) {
  deleting.value = c
  showDeleteModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await api.patch(`/customers/${editing.value.id}`, form.value)
    } else {
      await api.post('/customers', form.value)
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
    await api.delete(`/customers/${deleting.value.id}`)
    showDeleteModal.value = false
    await load()
  } catch {
    showDeleteModal.value = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatPhone(p) {
  if (!p) return '—'
  return p.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

function formatBalance(v) {
  if (storeSettings.value.cashback_kind === 'money') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  }
  return `${Math.floor(v || 0)} pts`
}

function viewStatement(c) {
  router.push(`/customers/${c.id}`)
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Clientes</h2>
        <p>Gerencie clientes e veja o extrato de fidelidade</p>
      </div>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Cliente
      </button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-wrap" style="flex:1;max-width:320px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="form-input" placeholder="Buscar por nome, CPF ou telefone..." />
        </div>
        <span class="badge badge-gray">{{ filtered.length }} cliente{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p>{{ search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado' }}</p>
        <span v-if="!search">Clique em "Novo Cliente" para começar</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>CPF</th><th>Telefone</th><th>Nascimento</th><th>Saldo</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id">
              <td><strong style="cursor:pointer" @click="viewStatement(c)">{{ c.name }}</strong></td>
              <td>{{ c.cpf || '—' }}</td>
              <td>{{ formatPhone(c.phone_number) }}</td>
              <td>{{ formatDate(c.birth_date) }}</td>
              <td><span class="credits-pill">{{ formatBalance(c.available_credits) }}</span></td>
              <td>
                <div class="action-group">
                  <button class="btn btn-ghost btn-sm" @click="viewStatement(c)">Extrato</button>
                  <button v-if="auth.can('can_edit_customers')" class="btn btn-ghost btn-sm" @click="openEdit(c)">Editar</button>
                  <button v-if="auth.can('can_delete_customers')" class="btn btn-danger btn-sm" @click="openDelete(c)">Remover</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editing ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.name" class="form-input" placeholder="Nome completo" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">CPF</label>
                <input v-model="form.cpf" class="form-input" placeholder="000.000.000-00" />
              </div>
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input v-model="form.phone_number" class="form-input" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Data de Nascimento</label>
              <input v-model="form.birth_date" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                <input type="checkbox" v-model="form.whatsapp_opt_in" />
                Aceita receber avisos por WhatsApp (cashback recebido, expirando, etc.)
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showModal = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner" />
              <span v-else>{{ editing ? 'Salvar' : 'Cadastrar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal" style="max-width:360px">
          <div class="modal-header">
            <h3>Remover cliente</h3>
            <button class="modal-close" @click="showDeleteModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="color:var(--text-medium)">Tem certeza que deseja remover <strong>{{ deleting?.name }}</strong>? Esta ação não pode ser desfeita.</p>
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
