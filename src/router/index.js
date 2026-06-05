import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../views/auth/LoginView.vue'), meta: { public: true } },
  { path: '/register', component: () => import('../views/auth/RegisterView.vue'), meta: { public: true } },
  { path: '/cadastro/:storeId', component: () => import('../views/public/CustomerRegisterView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'customers', component: () => import('../views/customers/CustomersView.vue') },
      { path: 'customers/:id', component: () => import('../views/customers/CustomerDetailView.vue') },
      { path: 'sales', component: () => import('../views/sales/SalesView.vue') },
      { path: 'products', component: () => import('../views/products/ProductsView.vue') },
      { path: 'categories', component: () => import('../views/categories/CategoriesView.vue') },
      { path: 'credit-rules', component: () => import('../views/credit-rules/CreditRulesView.vue') },
      { path: 'settings', component: () => import('../views/settings/StoreSettingsView.vue'), meta: { permission: 'can_manage_settings', adminAlwaysAllowed: true } },
      { path: 'qrcode', component: () => import('../views/qrcode/QRCodeView.vue') },
      { path: 'collaborators', component: () => import('../views/collaborators/CollaboratorsView.vue'), meta: { adminOnly: true } },
      { path: 'profile', component: () => import('../views/profile/ProfileView.vue'), meta: { adminOnly: true } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({ history: createWebHistory(), routes })

// Exported as a pure function so it can be unit tested in isolation.
// Returns a redirect path (string) or undefined to allow navigation.
export function navigationGuard(to) {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) return '/login'
  if (to.meta.public && token && (to.path === '/login' || to.path === '/register')) return '/dashboard'

  if (token && (to.meta.adminOnly || to.meta.permission)) {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const isAdmin = user?.role !== 'collaborator'
    if (to.meta.adminOnly && !isAdmin) return '/dashboard'
    if (to.meta.permission && !isAdmin && !user?.permissions?.[to.meta.permission]) return '/dashboard'
  }
}

router.beforeEach(navigationGuard)

export default router
