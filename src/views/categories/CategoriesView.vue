<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/index.js'

const categories = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref(null)
const deleting = ref(null)
const saving = ref(false)
const error = ref('')
const form = ref({ name: '' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return q ? categories.value.filter(c => c.name.toLowerCase().includes(q)) : categories.value
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/categories')
    categories.value = data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '' }
  error.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = { name: c.name }
  error.value = ''
  showModal.value = true
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await api.patch(`/categories/${editing.value.id}`, form.value)
    } else {
      await api.post('/categories', form.value)
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
    await api.delete(`/categories/${deleting.value.id}`)
  } finally {
    showDeleteModal.value = false
    await load()
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Categorias</h2>
        <p>Organize seus produtos por categoria</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Categoria
      </button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-wrap" style="flex:1;max-width:300px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="form-input" placeholder="Buscar categoria..." />
        </div>
        <span class="badge badge-gray">{{ filtered.length }} categoria{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        <p>{{ search ? 'Categoria não encontrada' : 'Nenhuma categoria criada' }}</p>
        <span v-if="!search">Crie categorias para organizar seus produtos</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>Produtos</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id">
              <td><strong>{{ c.name }}</strong></td>
              <td><span class="badge badge-blue">{{ c.products_count }} produto{{ c.products_count !== 1 ? 's' : '' }}</span></td>
              <td>
                <div class="action-group">
                  <button class="btn btn-ghost btn-sm" @click="openEdit(c)">Editar</button>
                  <button class="btn btn-danger btn-sm" @click="deleting = c; showDeleteModal = true">Remover</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>{{ editing ? 'Editar Categoria' : 'Nova Categoria' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.name" class="form-input" placeholder="Ex: Bebidas" required />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showModal = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner" />
              <span v-else>{{ editing ? 'Salvar' : 'Criar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal" style="max-width:360px">
          <div class="modal-header">
            <h3>Remover categoria</h3>
            <button class="modal-close" @click="showDeleteModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="color:var(--text-medium)">Remover <strong>{{ deleting?.name }}</strong>? Os produtos desta categoria também serão afetados.</p>
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
