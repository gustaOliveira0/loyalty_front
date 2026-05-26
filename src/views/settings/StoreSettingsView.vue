<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const form = ref({ cashback_kind: 'points', cashback_expires_in_days: 30, cashback_min_redeem: 0 })
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const error = ref('')

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/store_settings')
    form.value = {
      cashback_kind: data.cashback_kind,
      cashback_expires_in_days: data.cashback_expires_in_days,
      cashback_min_redeem: data.cashback_min_redeem
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  message.value = ''
  error.value = ''
  saving.value = true
  try {
    await api.put('/store_settings', form.value)
    message.value = 'Configurações salvas'
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? errs.join(', ') : 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Configurações de Cashback</h2>
        <p>Defina como o cashback funciona em sua loja</p>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:48px"><span class="spinner dark" /></div>

    <div v-else class="card" style="max-width:640px">
      <div class="card-header"><h3 style="margin:0;font-size:16px">Cashback</h3></div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:18px">
        <div v-if="message" class="alert" style="background:#e6ffed;color:#0a6d2c">{{ message }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">Unidade do cashback</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" value="money" v-model="form.cashback_kind" />
              💰 Dinheiro (R$)
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" value="points" v-model="form.cashback_kind" />
              ⭐ Pontos
            </label>
          </div>
          <small style="color:var(--text-muted);font-size:12px">
            Define em qual unidade o saldo dos clientes é mantido. Você ainda configura percentual ou valor fixo por produto.
          </small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Validade do cashback (dias)</label>
            <input v-model.number="form.cashback_expires_in_days" type="number" min="0" step="1" class="form-input" />
            <small style="color:var(--text-muted);font-size:12px">0 = nunca expira</small>
          </div>
          <div class="form-group">
            <label class="form-label">Valor mínimo para resgate</label>
            <input v-model.number="form.cashback_min_redeem" type="number" min="0" step="0.01" class="form-input" />
            <small style="color:var(--text-muted);font-size:12px">Impede resgates de valores muito baixos</small>
          </div>
        </div>

        <div>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <span v-if="saving" class="spinner" />
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
