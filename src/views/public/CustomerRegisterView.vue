<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/index.js'
import { formatCPF, formatPhone, onlyDigits } from '../../utils/format.js'

const route = useRoute()
const storeId = route.params.storeId

const storeName = ref('')
const loadingStore = ref(true)
const storeNotFound = ref(false)

const submitted = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const form = ref({
  name: '',
  cpf: '',
  phone_number: '',
  birth_date: '',
})

// LGPD (Art. 7, I / Art. 8) — consentimento livre, informado e inequívoco.
// O envio só é permitido com a caixa marcada e o valor vai ao backend.
const consent = ref(false)
const showPrivacy = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get(`/public/store/${storeId}`)
    storeName.value = data.store_name
  } catch {
    storeNotFound.value = true
  } finally {
    loadingStore.value = false
  }
})

function onCPFInput(e) {
  form.value.cpf = formatCPF(e.target.value)
}

function onPhoneInput(e) {
  form.value.phone_number = formatPhone(e.target.value)
}

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const payload = {
      store_id: storeId,
      name: form.value.name,
      cpf: onlyDigits(form.value.cpf),
      phone_number: onlyDigits(form.value.phone_number),
      birth_date: form.value.birth_date,
      consent: consent.value,
    }
    const { data } = await api.post('/public/customers', payload)
    successMessage.value = data.message
    submitted.value = true
  } catch (e) {
    const errs = e.response?.data?.errors
    error.value = errs ? errs.join(', ') : (e.response?.data?.error || 'Erro ao cadastrar. Tente novamente.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="pub-page">
    <div class="pub-card">

      <!-- Loading -->
      <div v-if="loadingStore" class="pub-center">
        <span class="spinner" style="width:32px;height:32px;border-color:rgba(255,255,255,.3);border-top-color:#fff" />
      </div>

      <!-- Loja não encontrada -->
      <div v-else-if="storeNotFound" class="pub-center">
        <div class="pub-icon pub-icon-err">✕</div>
        <h2>Loja não encontrada</h2>
        <p>O QR Code pode estar desatualizado.<br>Solicite um novo ao estabelecimento.</p>
      </div>

      <!-- Sucesso -->
      <div v-else-if="submitted" class="pub-center">
        <div class="pub-icon pub-icon-ok">★</div>
        <h2>Cadastro realizado!</h2>
        <p>{{ successMessage }}</p>
        <div class="pub-tip">Agora suas compras geram pontos de fidelidade automaticamente.</div>
      </div>

      <!-- Formulário -->
      <template v-else>
        <div class="pub-header">
          <div class="pub-logo">★</div>
          <h1>Programa de Fidelidade</h1>
          <p class="pub-store">{{ storeName }}</p>
          <p class="pub-subtitle">Cadastre-se e ganhe pontos a cada compra!</p>
        </div>

        <div v-if="error" class="pub-alert">{{ error }}</div>

        <form @submit.prevent="submit" class="pub-form">
          <div class="pub-field">
            <label>Nome completo *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Seu nome completo"
              required
              autocomplete="name"
            />
          </div>

          <div class="pub-field">
            <label>CPF *</label>
            <input
              :value="form.cpf"
              @input="onCPFInput"
              type="text"
              inputmode="numeric"
              placeholder="000.000.000-00"
              required
              maxlength="14"
              autocomplete="off"
            />
          </div>

          <div class="pub-field">
            <label>Telefone / WhatsApp *</label>
            <input
              :value="form.phone_number"
              @input="onPhoneInput"
              type="text"
              inputmode="tel"
              placeholder="(11) 99999-9999"
              required
              maxlength="15"
              autocomplete="tel"
            />
          </div>

          <div class="pub-field">
            <label>Data de nascimento *</label>
            <input
              v-model="form.birth_date"
              type="date"
              required
              :max="new Date().toISOString().substring(0,10)"
            />
          </div>

          <!-- LGPD — consentimento obrigatório, livre e informado (Art. 7, I / Art. 8) -->
          <label class="pub-consent">
            <input type="checkbox" v-model="consent" />
            <span>
              Li e concordo com o tratamento dos meus dados pessoais conforme a
              <button type="button" class="pub-link" @click="showPrivacy = !showPrivacy">
                Política de Privacidade
              </button>.
            </span>
          </label>

          <div v-if="showPrivacy" class="pub-policy">
            <p><strong>Controlador:</strong> {{ storeName }} (estabelecimento responsável).</p>
            <p><strong>Finalidade:</strong> cadastro e operação do programa de fidelidade —
              identificar você nas compras, acumular e resgatar pontos e enviar comunicações
              sobre benefícios.</p>
            <p><strong>Dados coletados:</strong> nome, CPF, telefone e data de nascimento.</p>
            <p><strong>Base legal:</strong> seu consentimento (LGPD, Art. 7, I).</p>
            <p><strong>Compartilhamento:</strong> seus dados não são vendidos nem compartilhados
              com terceiros para fins de marketing.</p>
            <p><strong>Seus direitos (Art. 18):</strong> você pode, a qualquer momento, solicitar
              acesso, correção, portabilidade ou exclusão dos seus dados e revogar este
              consentimento, entrando em contato com o estabelecimento.</p>
          </div>

          <button type="submit" class="pub-btn" :disabled="saving || !consent">
            <span v-if="saving" class="spinner" style="width:20px;height:20px;border-color:rgba(255,255,255,.3);border-top-color:#fff" />
            <span v-else>Cadastrar e ganhar pontos</span>
          </button>
        </form>

        <p class="pub-privacy">
          Tratamos seus dados exclusivamente para o programa de fidelidade, com base no seu
          consentimento. Você pode revogá-lo e solicitar a exclusão dos seus dados a qualquer momento.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pub-page {
  min-height: 100dvh;
  background: linear-gradient(160deg, var(--red-900) 0%, var(--red-700) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px 40px;
}

.pub-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  box-shadow: var(--shadow-lg);
}

@media (max-width: 480px) {
  .pub-card { padding: 28px 20px; }
  .pub-page { padding: 16px 12px 32px; }
}

.pub-center {
  text-align: center;
  padding: 24px 0;
}
.pub-center h2 { font-size: 20px; font-weight: 700; color: var(--text-dark); margin: 12px 0 8px; }
.pub-center p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

.pub-icon {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; margin: 0 auto 8px;
}
.pub-icon-ok { background: #EAF7EE; color: #1E7E34; }
.pub-icon-err { background: var(--red-100); color: var(--red-700); }

.pub-tip {
  margin-top: 16px; background: var(--cream-100);
  border-radius: var(--radius-sm); padding: 12px 16px;
  font-size: 13px; color: var(--text-medium);
}

.pub-header { text-align: center; margin-bottom: 24px; }
.pub-logo {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, var(--red-600), var(--red-700));
  color: white; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(192,57,43,.35);
}
.pub-header h1 { font-size: 20px; font-weight: 800; color: var(--text-dark); }
.pub-store { font-size: 16px; font-weight: 700; color: var(--red-600); margin-top: 4px; }
.pub-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

.pub-alert {
  background: var(--red-100); color: var(--red-700);
  border: 1px solid #f5c6c2; border-radius: var(--radius-sm);
  padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
}

.pub-form { display: flex; flex-direction: column; gap: 14px; }

.pub-field { display: flex; flex-direction: column; gap: 5px; }
.pub-field label { font-size: 13px; font-weight: 600; color: var(--text-medium); }
.pub-field input {
  padding: 12px 14px;
  border: 1.5px solid var(--cream-300);
  border-radius: var(--radius-sm);
  font-size: 16px; /* prevents iOS zoom */
  color: var(--text-dark);
  background: var(--white);
  outline: none;
  transition: border-color .15s;
  font-family: inherit;
  width: 100%;
  -webkit-appearance: none;
}
.pub-field input:focus { border-color: var(--red-500); box-shadow: 0 0 0 3px rgba(192,57,43,.1); }

.pub-btn {
  margin-top: 8px; padding: 14px;
  background: linear-gradient(135deg, var(--red-600), var(--red-700));
  color: white; border: none; border-radius: var(--radius-md);
  font-size: 16px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: inherit;
  transition: opacity .15s;
  box-shadow: 0 4px 12px rgba(192,57,43,.4);
}
.pub-btn:disabled { opacity: .7; cursor: not-allowed; }
.pub-btn:not(:disabled):hover { opacity: .92; }

.pub-consent {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--text-medium); line-height: 1.5;
  margin-top: 4px; cursor: pointer;
}
.pub-consent input { margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0; accent-color: var(--red-600); }

.pub-link {
  background: none; border: none; padding: 0; cursor: pointer;
  color: var(--red-600); font: inherit; font-weight: 600;
  text-decoration: underline;
}

.pub-policy {
  background: var(--cream-100); border-radius: var(--radius-sm);
  padding: 12px 14px; font-size: 12px; color: var(--text-medium);
  line-height: 1.55; display: flex; flex-direction: column; gap: 6px;
}
.pub-policy strong { color: var(--text-dark); }

.pub-privacy {
  font-size: 11px; color: var(--text-muted);
  text-align: center; margin-top: 16px; line-height: 1.5;
}
</style>
