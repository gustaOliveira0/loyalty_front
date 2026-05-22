<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirmation.value) {
    error.value = 'As senhas não coincidem'
    return
  }
  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value, passwordConfirmation.value)
    router.push('/dashboard')
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? errs.join(', ') : (e.response?.data?.error || 'Erro ao cadastrar')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <h1>★ Fidelidade</h1>
        <p>Sistema de Programa de Pontos</p>
      </div>

      <h2 class="auth-title">Criar conta</h2>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">Nome completo</label>
          <input v-model="name" type="text" class="form-input" placeholder="João Silva" required />
        </div>
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input v-model="email" type="email" class="form-input" placeholder="seu@email.com" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Senha</label>
            <input v-model="password" type="password" class="form-input" placeholder="••••••••" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar senha</label>
            <input v-model="passwordConfirmation" type="password" class="form-input" placeholder="••••••••" required />
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Criar conta</span>
        </button>
      </form>

      <div class="auth-link">
        Já tem conta?
        <a @click="$router.push('/login')">Entrar</a>
      </div>
    </div>
  </div>
</template>
