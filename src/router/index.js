import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdukView from '../views/ProdukView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DetailProdukView from '../views/DetailProdukView.vue'
import KeranjangView from '../views/KeranjangView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import RiwayatView from '../views/RiwayatView.vue'
import ProfilView from '../views/ProfilView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminTransaksiView from '../views/AdminTransaksiView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/produk', name: 'produk', component: ProdukView, meta: { requiresAdmin: true } },
  { path: '/produk/:id', name: 'detail-produk', component: DetailProdukView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/keranjang', name: 'keranjang', component: KeranjangView },
  { path: '/checkout', name: 'checkout', component: CheckoutView },
  { path: '/riwayat', name: 'riwayat', component: RiwayatView },
  { path: '/profil', name: 'profil', component: ProfilView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAdmin: true } },
  { path: '/admin/transaksi', name: 'admin-transaksi', component: AdminTransaksiView, meta: { requiresAdmin: true } }
  , { path: '/admin/users', name: 'admin-users', component: AdminUsersView, meta: { requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Tolerant role check: accept 'admin', 'administrator', or any role containing 'admin'
  if (to.meta.requiresAdmin) {
    const role = (user.role || '').toString().toLowerCase()
    const isAdmin = role === 'admin' || role === 'administrator' || role.includes('admin')
    if (!isAdmin) {
      alert('Akses ditolak! Halaman khusus Admin.')
      return { name: 'home' }
    }
  }
})

export default router