<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import IconNav from './IconNav.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
  { label: 'Clientes', path: '/customers', icon: 'users' },
  { label: 'Vendas', path: '/sales', icon: 'shopping-cart' },
  { label: 'Produtos', path: '/products', icon: 'package' },
  { label: 'Categorias', path: '/categories', icon: 'tag' },
  { label: 'Configurações', path: '/settings', icon: 'star' },
  { label: 'Meu QR Code', path: '/qrcode', icon: 'qrcode' },
]

const pageTitle = computed(() => {
  const item = navItems.find(n => route.path.startsWith(n.path))
  return item?.label || 'Painel'
})

const userInitials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
})

function navigate(path) {
  router.push(path)
  sidebarOpen.value = false
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <div class="sidebar-overlay" :class="{ open: sidebarOpen }" @click="sidebarOpen = false" />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-logo">
        <h1>★ Fidelidade</h1>
        <p>Sistema de Pontos</p>
      </div>

      <div class="sidebar-user">
        <div class="sidebar-avatar">{{ userInitials }}</div>
        <div style="min-width:0">
          <div class="sidebar-user-name">{{ auth.user?.name }}</div>
          <div class="sidebar-user-email">{{ auth.user?.email }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">Menu</div>
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: route.path.startsWith(item.path) }"
          @click="navigate(item.path)"
        >
          <IconNav :name="item.icon" />
          {{ item.label }}
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="topbar">
        <button class="topbar-menu-btn" @click="sidebarOpen = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="topbar-title">{{ pageTitle }}</span>
        <div class="topbar-spacer" />
      </header>

      <main class="page-body">
        <RouterView />
      </main>
    </div>
  </div>
</template>
