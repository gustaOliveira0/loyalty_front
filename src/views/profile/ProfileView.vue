<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'
import { useAuthStore } from '../../stores/auth.js'

const auth = useAuthStore()

const loading = ref(true)
const profile = ref({ name: '', email: '' })

const infoForm = ref({ name: '', email: '' })
const infoSaving = ref(false)
const infoSuccess = ref('')
const infoError = ref('')

const pwForm = ref({ current_password: '', password: '', password_confirmation: '' })
const pwSaving = ref(false)
const pwSuccess = ref('')
const pwError = ref('')

async function load() {
  try {
    const { data } = await api.get('/profile')
    profile.value = data
    infoForm.value.name = data.name
    infoForm.value.email = data.email
  } finally {
    loading.value = false
  }
}

async function saveInfo() {
  infoSaving.value = true
  infoSuccess.value = ''
  infoError.value = ''
  try {
    const { data } = await api.patch('/profile', {
      name: infoForm.value.name,
      email: infoForm.value.email,
    })
    profile.value = data
    auth.user = { ...auth.user, name: data.name, email: data.email }
    localStorage.setItem('user', JSON.stringify(auth.user))
    infoSuccess.value = 'Dados atualizados com sucesso.'
  } catch (e) {
    const msgs = e.response?.data?.errors
    infoError.value = Array.isArray(msgs) ? msgs.join(', ') : 'Erro ao salvar.'
  } finally {
    infoSaving.value = false
  }
}

async function savePassword() {
  pwSaving.value = true
  pwSuccess.value = ''
  pwError.value = ''
  try {
    await api.patch('/profile', {
      current_password: pwForm.value.current_password,
      password: pwForm.value.password,
      password_confirmation: pwForm.value.password_confirmation,
    })
    pwForm.value = { current_password: '', password: '', password_confirmation: '' }
    pwSuccess.value = 'Senha alterada com sucesso.'
  } catch (e) {
    const msgs = e.response?.data?.errors
    pwError.value = Array.isArray(msgs) ? msgs.join(', ') : 'Erro ao alterar senha.'
  } finally {
    pwSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div style="max-width:640px">

    <div v-if="loading" style="text-align:center;padding:3rem">
      <span class="spinner dark" />
    </div>

    <template v-else>
      <!-- Dados da conta -->
      <div class="card" style="margin-bottom:1.5rem">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f0e8e8">
          <h3 style="margin:0;font-size:1rem;font-weight:600">Dados da conta</h3>
          <p style="margin:.25rem 0 0;font-size:.875rem;color:#777">Nome e e-mail de acesso ao sistema.</p>
        </div>
        <form @submit.prevent="saveInfo" style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
          <div v-if="infoSuccess" class="alert alert-success">{{ infoSuccess }}</div>
          <div v-if="infoError" class="alert alert-error">{{ infoError }}</div>

          <div class="form-group" style="margin:0">
            <label class="form-label">Nome da empresa / loja *</label>
            <input v-model="infoForm.name" class="form-input" required placeholder="Nome visível no sistema" />
          </div>

          <div class="form-group" style="margin:0">
            <label class="form-label">E-mail de acesso *</label>
            <input v-model="infoForm.email" class="form-input" type="email" required placeholder="email@empresa.com" />
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button type="submit" class="btn btn-primary" :disabled="infoSaving">
              {{ infoSaving ? 'Salvando...' : 'Salvar dados' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Alterar senha -->
      <div class="card">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f0e8e8">
          <h3 style="margin:0;font-size:1rem;font-weight:600">Alterar senha</h3>
          <p style="margin:.25rem 0 0;font-size:.875rem;color:#777">Para alterar, informe sua senha atual e a nova senha.</p>
        </div>
        <form @submit.prevent="savePassword" style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
          <div v-if="pwSuccess" class="alert alert-success">{{ pwSuccess }}</div>
          <div v-if="pwError" class="alert alert-error">{{ pwError }}</div>

          <div class="form-group" style="margin:0">
            <label class="form-label">Senha atual *</label>
            <input v-model="pwForm.current_password" class="form-input" type="password" required placeholder="Sua senha atual" />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group" style="margin:0">
              <label class="form-label">Nova senha *</label>
              <input v-model="pwForm.password" class="form-input" type="password" required
                placeholder="Mínimo 6 caracteres" minlength="6" />
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Confirmar nova senha *</label>
              <input v-model="pwForm.password_confirmation" class="form-input" type="password" required
                placeholder="Repita a nova senha" />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button type="submit" class="btn btn-primary" :disabled="pwSaving">
              {{ pwSaving ? 'Alterando...' : 'Alterar senha' }}
            </button>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>
