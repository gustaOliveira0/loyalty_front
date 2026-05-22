<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao fazer login'
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

      <h2 class="auth-title">Entrar na conta</h2>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input v-model="email" type="email" class="form-input" placeholder="seu@email.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">Senha</label>
          <input v-model="password" type="password" class="form-input" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Entrar</span>
        </button>
      </form>

      <div class="auth-link">
        Não tem conta?
        <a @click="$router.push('/register')">Cadastre-se</a>
      </div>
    </div>
  </div>
</template>
