<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import api from '../../api/index.js'
import { useAuthStore } from '../../stores/auth.js'

const auth = useAuthStore()
const registrationUrl = ref('')
const storeName = ref('')
const qrDataUrl = ref('')
const loading = ref(true)
const error = ref('')
const copied = ref(false)
const qrSize = ref(300)

onMounted(async () => {
  try {
    const { data } = await api.get('/qrcode')
    registrationUrl.value = data.url
    storeName.value = data.store_name
    await generateQR(data.url)
  } catch (e) {
    error.value = 'Erro ao gerar QR Code. Verifique a conexão com o servidor.'
  } finally {
    loading.value = false
  }
})

async function generateQR(url) {
  qrDataUrl.value = await QRCode.toDataURL(url, {
    width: qrSize.value,
    margin: 2,
    color: { dark: '#7B1A12', light: '#FFFDF9' },
    errorCorrectionLevel: 'H',
  })
}

async function changeSize(size) {
  qrSize.value = size
  if (registrationUrl.value) await generateQR(registrationUrl.value)
}

function downloadQR() {
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qrcode-fidelidade-${storeName.value.toLowerCase().replace(/\s+/g, '-')}.png`
  a.click()
}

async function downloadHighRes() {
  const highRes = await QRCode.toDataURL(registrationUrl.value, {
    width: 1200,
    margin: 3,
    color: { dark: '#7B1A12', light: '#FFFDF9' },
    errorCorrectionLevel: 'H',
  })
  const a = document.createElement('a')
  a.href = highRes
  a.download = `qrcode-fidelidade-${storeName.value.toLowerCase().replace(/\s+/g, '-')}-alta-resolucao.png`
  a.click()
}

async function copyLink() {
  await navigator.clipboard.writeText(registrationUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-text">
        <h2>Meu QR Code</h2>
        <p>Imprima e cole na parede — clientes escaneiam para se cadastrar</p>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:64px">
      <span class="spinner dark" style="width:36px;height:36px" />
      <p style="margin-top:12px;color:var(--text-muted);font-size:14px">Gerando QR Code...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else>
      <div class="qr-layout">

        <!-- QR Code Card -->
        <div class="card qr-main-card">
          <div class="qr-preview-area">
            <div class="qr-brand-badge">★ Fidelidade</div>
            <div class="qr-image-wrap">
              <img :src="qrDataUrl" alt="QR Code de cadastro" class="qr-image" />
            </div>
            <div class="qr-store-label">{{ storeName }}</div>
            <div class="qr-call-to-action">Escaneie e cadastre-se para ganhar pontos!</div>
          </div>

          <div class="card-body" style="border-top:1px solid var(--cream-200)">
            <div style="margin-bottom:14px">
              <div class="form-label" style="margin-bottom:8px">Tamanho do download</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button
                  v-for="s in [200, 300, 400]"
                  :key="s"
                  class="btn btn-sm"
                  :class="qrSize === s ? 'btn-primary' : 'btn-ghost'"
                  @click="changeSize(s)"
                >
                  {{ s }}px
                </button>
              </div>
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-primary" @click="downloadQR" style="flex:1;min-width:160px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar PNG ({{ qrSize }}px)
              </button>
              <button class="btn btn-secondary" @click="downloadHighRes" style="flex:1;min-width:160px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Alta Resolução (1200px)
              </button>
            </div>
          </div>
        </div>

        <!-- Info e instruções -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Link de cadastro -->
          <div class="card">
            <div class="card-header"><h3>Link de cadastro</h3></div>
            <div class="card-body">
              <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">
                Compartilhe este link ou use o QR Code acima. Qualquer pessoa que acessar poderá se cadastrar como cliente da sua loja.
              </p>
              <div class="link-box">
                <span class="link-text">{{ registrationUrl }}</span>
                <button class="btn btn-sm" :class="copied ? 'btn-primary' : 'btn-ghost'" @click="copyLink">
                  <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {{ copied ? 'Copiado!' : 'Copiar' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Como usar -->
          <div class="card">
            <div class="card-header"><h3>Como usar</h3></div>
            <div class="card-body">
              <div class="how-step">
                <div class="how-num">1</div>
                <div>
                  <strong>Baixe o QR Code</strong>
                  <p>Use "Alta Resolução" para impressão nítida em qualquer tamanho.</p>
                </div>
              </div>
              <div class="how-step">
                <div class="how-num">2</div>
                <div>
                  <strong>Imprima e cole</strong>
                  <p>Cole no balcão, na parede ou na embalagem dos produtos.</p>
                </div>
              </div>
              <div class="how-step">
                <div class="how-num">3</div>
                <div>
                  <strong>Cliente escaneia</strong>
                  <p>O cliente abre a câmera do celular, aponta para o QR Code e preenche o cadastro.</p>
                </div>
              </div>
              <div class="how-step" style="margin-bottom:0">
                <div class="how-num">4</div>
                <div>
                  <strong>Pontos automáticos</strong>
                  <p>Ao registrar uma venda, os créditos são calculados automaticamente para o cliente.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.qr-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 860px) {
  .qr-layout { grid-template-columns: 1fr; }
}

.qr-main-card { overflow: hidden; width: fit-content; }
@media (max-width: 860px) { .qr-main-card { width: 100%; } }

.qr-preview-area {
  background: var(--cream-50);
  padding: 24px 28px 20px;
  display: flex; flex-direction: column; align-items: center;
  border-bottom: 1px solid var(--cream-200);
}

.qr-brand-badge {
  background: linear-gradient(135deg, var(--red-600), var(--red-700));
  color: white; padding: 6px 16px; border-radius: 100px;
  font-size: 13px; font-weight: 800; margin-bottom: 16px;
  letter-spacing: .5px;
}

.qr-image-wrap {
  background: var(--cream-50);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--cream-200);
}

.qr-image { display: block; width: 200px; height: 200px; }

.qr-store-label {
  font-size: 16px; font-weight: 800; color: var(--text-dark);
  margin-top: 14px;
}

.qr-call-to-action {
  font-size: 12px; color: var(--text-muted); margin-top: 4px; text-align: center;
  max-width: 220px; line-height: 1.4;
}

.link-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--cream-100); border: 1px solid var(--cream-200);
  border-radius: var(--radius-sm); padding: 8px 12px;
  overflow: hidden;
}
.link-text {
  flex: 1; font-size: 12px; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-family: monospace;
}

.how-step {
  display: flex; gap: 12px; align-items: flex-start;
  margin-bottom: 16px; font-size: 14px;
}
.how-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--red-600); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0; margin-top: 1px;
}
.how-step strong { display: block; color: var(--text-dark); margin-bottom: 2px; }
.how-step p { color: var(--text-muted); font-size: 13px; margin: 0; }
</style>
