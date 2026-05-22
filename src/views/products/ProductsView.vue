<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/index.js'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const search = ref('')
const filterCategory = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref(null)
const deleting = ref(null)
const saving = ref(false)
const error = ref('')
const form = ref({ name: '', value: '', description: '', category_id: '' })

const filtered = computed(() => {
  let list = products.value
  if (filterCategory.value) list = list.filter(p => p.category_id == filterCategory.value)
  const q = search.value.toLowerCase()
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q))
  return list
})

async function load() {
  loading.value = true
  try {
    const [p, c] = await Promise.all([api.get('/products'), api.get('/categories')])
    products.value = p.data
    categories.value = c.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', value: '', description: '', category_id: categories.value[0]?.id || '' }
  error.value = ''
  showModal.value = true
}

function openEdit(p) {
  editing.value = p
  form.value = { name: p.name, value: p.value, description: p.description || '', category_id: p.category_id }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    const payload = { name: form.value.name, value: form.value.value, description: form.value.description, category_id: form.value.category_id }
    if (editing.value) {
      await api.patch(`/products/${editing.value.id}`, payload)
    } else {
      await api.post('/products', payload)
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
    await api.delete(`/products/${deleting.value.id}`)
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
        <h2>Produtos</h2>
        <p>Gerencie seu catálogo de produtos</p>
      </div>
      <button class="btn btn-primary" @click="openCreate" :disabled="categories.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo Produto
      </button>
    </div>

    <div v-if="!loading && categories.length === 0" class="alert alert-error" style="margin-bottom:16px">
      Crie ao menos uma <RouterLink to="/categories" style="font-weight:700;color:var(--red-700)">categoria</RouterLink> antes de adicionar produtos.
    </div>

    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:10px">
        <div class="search-wrap" style="flex:1;min-width:200px;max-width:300px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="form-input" placeholder="Buscar produto..." />
        </div>
        <select v-model="filterCategory" class="form-select" style="width:auto;min-width:160px">
          <option value="">Todas as categorias</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <span class="badge badge-gray">{{ filtered.length }} produto{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <p>{{ search || filterCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado' }}</p>
        <span v-if="!search && !filterCategory">Clique em "Novo Produto" para começar</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Descrição</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id">
              <td><strong>{{ p.name }}</strong></td>
              <td><span class="badge badge-blue">{{ p.category_name }}</span></td>
              <td><strong style="color:var(--red-700)">{{ formatCurrency(p.value) }}</strong></td>
              <td style="color:var(--text-muted);font-size:13px">{{ p.description || '—' }}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-ghost btn-sm" @click="openEdit(p)">Editar</button>
                  <button class="btn btn-danger btn-sm" @click="deleting = p; showDeleteModal = true">Remover</button>
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
            <h3>{{ editing ? 'Editar Produto' : 'Novo Produto' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.name" class="form-input" placeholder="Nome do produto" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Preço (R$) *</label>
                <input v-model="form.value" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
              </div>
              <div class="form-group">
                <label class="form-label">Categoria *</label>
                <select v-model="form.category_id" class="form-select">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea v-model="form.description" class="form-textarea" placeholder="Descrição opcional..." />
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
            <h3>Remover produto</h3>
            <button class="modal-close" @click="showDeleteModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="color:var(--text-medium)">Remover <strong>{{ deleting?.name }}</strong>? Esta ação não pode ser desfeita.</p>
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
