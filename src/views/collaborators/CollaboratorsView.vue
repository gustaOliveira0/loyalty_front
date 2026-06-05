<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const collaborators = ref([])
const loading = ref(false)
const error = ref('')

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const saving = ref(false)
const formError = ref('')

const PERMISSIONS = [
  { key: 'can_edit_customers',      label: 'Editar clientes' },
  { key: 'can_delete_customers',    label: 'Excluir clientes' },
  { key: 'can_create_sales',        label: 'Registrar vendas' },
  { key: 'can_manage_products',     label: 'Gerenciar produtos' },
  { key: 'can_manage_categories',   label: 'Gerenciar categorias' },
  { key: 'can_manage_credit_rules', label: 'Gerenciar regras de crédito' },
  { key: 'can_view_dashboard',      label: 'Ver dashboard' },
  { key: 'can_manage_settings',     label: 'Alterar configurações da loja' },
]

const emptyForm = () => ({
  name: '',
  cpf: '',
  birth_date: '',
  email: '',
  password: '',
  password_confirmation: '',
  ...Object.fromEntries(PERMISSIONS.map(p => [p.key, p.key !== 'can_manage_settings'])),
})

const form = ref(emptyForm())

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/collaborators')
    collaborators.value = data
  } catch (e) {
    error.value = 'Erro ao carregar colaboradores.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

function openEdit(collab) {
  editingId.value = collab.id
  form.value = {
    name: collab.name,
    cpf: collab.cpf || '',
    birth_date: collab.birth_date || '',
    email: collab.email,
    password: '',
    password_confirmation: '',
    ...Object.fromEntries(PERMISSIONS.map(p => [p.key, collab.permissions[p.key]])),
  }
  formError.value = ''
  showModal.value = true
}

function openDelete(collab) {
  deletingId.value = collab.id
  showDeleteModal.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form.value }
    if (!payload.password) {
      delete payload.password
      delete payload.password_confirmation
    }

    if (editingId.value) {
      const { data } = await api.patch(`/collaborators/${editingId.value}`, payload)
      const idx = collaborators.value.findIndex(c => c.id === editingId.value)
      if (idx !== -1) collaborators.value[idx] = data
    } else {
      const { data } = await api.post('/collaborators', payload)
      collaborators.value.push(data)
    }
    showModal.value = false
  } catch (e) {
    const msgs = e.response?.data?.errors
    formError.value = Array.isArray(msgs) ? msgs.join(', ') : 'Erro ao salvar colaborador.'
  } finally {
    saving.value = false
  }
}

async function toggleActive(collab) {
  try {
    const { data } = await api.patch(`/collaborators/${collab.id}`, { active: !collab.active })
    const idx = collaborators.value.findIndex(c => c.id === collab.id)
    if (idx !== -1) collaborators.value[idx] = data
  } catch {
    error.value = 'Erro ao alterar status do colaborador.'
  }
}

async function confirmDelete() {
  try {
    await api.delete(`/collaborators/${deletingId.value}`)
    collaborators.value = collaborators.value.filter(c => c.id !== deletingId.value)
    showDeleteModal.value = false
  } catch {
    error.value = 'Erro ao excluir colaborador.'
    showDeleteModal.value = false
  }
}

function formatCpf(cpf) {
  if (!cpf) return '—'
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <h2 style="margin:0;font-size:1.25rem;font-weight:600">Colaboradores</h2>
      <button class="btn btn-primary" @click="openCreate">+ Novo colaborador</button>
    </div>

    <div v-if="error" class="alert alert-error" style="margin-bottom:1rem">{{ error }}</div>

    <div v-if="loading" style="text-align:center;padding:2rem">
      <span class="spinner" />
    </div>

    <div v-else-if="collaborators.length === 0" class="card" style="text-align:center;padding:2rem;color:#888">
      Nenhum colaborador cadastrado.
    </div>

    <div v-else class="card" style="overflow:hidden;padding:0">
      <table class="table" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#fdf0f0;text-align:left">
            <th style="padding:.75rem 1rem">Nome</th>
            <th style="padding:.75rem 1rem">E-mail</th>
            <th style="padding:.75rem 1rem">CPF</th>
            <th style="padding:.75rem 1rem">Status</th>
            <th style="padding:.75rem 1rem">Permissões</th>
            <th style="padding:.75rem 1rem;text-align:right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="collab in collaborators"
            :key="collab.id"
            style="border-top:1px solid #f0e8e8"
          >
            <td style="padding:.75rem 1rem;font-weight:500">{{ collab.name }}</td>
            <td style="padding:.75rem 1rem;font-size:.875rem;color:#555">{{ collab.email }}</td>
            <td style="padding:.75rem 1rem;font-size:.875rem">{{ formatCpf(collab.cpf) }}</td>
            <td style="padding:.75rem 1rem">
              <span
                class="badge"
                :class="collab.active ? 'badge-success' : 'badge-neutral'"
              >
                {{ collab.active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td style="padding:.75rem 1rem;font-size:.8rem;color:#666;max-width:200px">
              <span v-for="p in PERMISSIONS.filter(p => collab.permissions[p.key])" :key="p.key"
                style="display:inline-block;background:#fdf0f0;border-radius:4px;padding:1px 6px;margin:1px;font-size:.75rem">
                {{ p.label }}
              </span>
              <span v-if="!PERMISSIONS.some(p => collab.permissions[p.key])" style="color:#aaa">Sem permissões</span>
            </td>
            <td style="padding:.75rem 1rem;text-align:right;white-space:nowrap">
              <button class="btn btn-sm btn-secondary" style="margin-right:.5rem" @click="openEdit(collab)">Editar</button>
              <button
                class="btn btn-sm"
                :class="collab.active ? 'btn-warning' : 'btn-success'"
                style="margin-right:.5rem"
                @click="toggleActive(collab)"
              >
                {{ collab.active ? 'Desativar' : 'Ativar' }}
              </button>
              <button class="btn btn-sm btn-danger" @click="openDelete(collab)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal" style="max-width:540px;max-height:90vh;overflow-y:auto">
          <div class="modal-header">
            <h3>{{ editingId ? 'Editar colaborador' : 'Novo colaborador' }}</h3>
            <button class="modal-close" @click="showModal = false">✕</button>
          </div>

          <div style="padding:1.25rem 1.5rem 0">
            <div v-if="formError" class="alert alert-error" style="margin-bottom:0">{{ formError }}</div>
          </div>

          <form @submit.prevent="save" style="padding:1.25rem 1.5rem 1.5rem">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.name" class="form-input" required placeholder="Nome completo" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group">
                <label class="form-label">CPF *</label>
                <input v-model="form.cpf" class="form-input" required placeholder="000.000.000-00" maxlength="14" />
              </div>
              <div class="form-group">
                <label class="form-label">Data de nascimento *</label>
                <input v-model="form.birth_date" class="form-input" type="date" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">E-mail *</label>
              <input v-model="form.email" class="form-input" type="email" required placeholder="email@exemplo.com" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group">
                <label class="form-label">{{ editingId ? 'Nova senha (opcional)' : 'Senha *' }}</label>
                <input v-model="form.password" class="form-input" type="password"
                  :required="!editingId" placeholder="Mínimo 6 caracteres" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar senha</label>
                <input v-model="form.password_confirmation" class="form-input" type="password"
                  :required="!editingId || !!form.password" placeholder="Repita a senha" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="margin-bottom:.75rem">Permissões de acesso</label>
              <div style="border:1px solid #e8d8d8;border-radius:8px;overflow:hidden">
                <div
                  v-for="(perm, idx) in PERMISSIONS"
                  :key="perm.key"
                  style="display:flex;align-items:center;justify-content:space-between;padding:.625rem 1rem"
                  :style="idx > 0 ? 'border-top:1px solid #f0e8e8' : ''"
                >
                  <span style="font-size:.9rem">{{ perm.label }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="form[perm.key]" />
                    <span class="switch-track"></span>
                  </label>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem">
              <button type="button" class="btn btn-secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>Excluir colaborador</h3>
            <button class="modal-close" @click="showDeleteModal = false">✕</button>
          </div>
          <p style="color:#555;margin-bottom:1.5rem">
            Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
          </p>
          <div style="display:flex;gap:.75rem;justify-content:flex-end">
            <button class="btn btn-secondary" @click="showDeleteModal = false">Cancelar</button>
            <button class="btn btn-danger" @click="confirmDelete">Excluir</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
