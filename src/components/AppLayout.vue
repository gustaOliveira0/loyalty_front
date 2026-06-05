<script setup>
import { computed } from 'vue'
import { ref } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import IconNav from './IconNav.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const allNavItems = [
  { label: 'Dashboard',     path: '/dashboard',     icon: 'grid',          permission: 'can_view_dashboard' },
  { label: 'Clientes',      path: '/customers',      icon: 'users' },
  { label: 'Vendas',        path: '/sales',          icon: 'shopping-cart' },
  { label: 'Produtos',      path: '/products',       icon: 'package' },
  { label: 'Categorias',    path: '/categories',     icon: 'tag' },
  { label: 'Configurações', path: '/settings',       icon: 'star',          adminOnly: true },
  { label: 'Meu QR Code',  path: '/qrcode',         icon: 'qrcode',        adminOnly: true },
  { label: 'Colaboradores', path: '/collaborators',  icon: 'users-admin',   adminOnly: true },
  { label: 'Minha Conta',   path: '/profile',        icon: 'profile',       adminOnly: true },
]

const navItems = computed(() => allNavItems.filter(item => {
  if (item.adminOnly) return auth.isAdmin
  if (item.permission) return auth.can(item.permission)
  return true
}))

const pageTitle = computed(() => {
  const item = allNavItems.find(n => route.path.startsWith(n.path))
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

      <div
        class="sidebar-user"
        :class="{ 'sidebar-user--clickable': auth.isAdmin }"
        @click="auth.isAdmin && navigate('/profile')"
      >
        <div class="sidebar-avatar">{{ userInitials }}</div>
        <div style="min-width:0;flex:1">
          <div class="sidebar-user-name">{{ auth.user?.name }}</div>
          <div class="sidebar-user-email">{{ auth.user?.email }}</div>
          <div v-if="!auth.isAdmin" style="font-size:.7rem;color:#c0392b;font-weight:600;margin-top:2px">Colaborador</div>
        </div>
        <svg v-if="auth.isAdmin" class="sidebar-user-edit-icon"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
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
