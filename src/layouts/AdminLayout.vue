<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard', name: 'dashboard' },
  { label: 'Verifikasi Transaksi', icon: '✅', path: '/admin/transaksi', name: 'admin-transaksi' },
  { label: 'Kelola Produk', icon: '📦', path: '/produk', name: 'produk' },
  { label: 'Kelola Kategori', icon: '🏷️', path: '/admin/kategori', name: 'admin-kategori' },
  { label: 'Laporan Penjualan', icon: '📈', path: '/admin/laporan', name: 'admin-laporan' },
  { label: 'Manajemen Restok', icon: '📥', path: '/admin/restok', name: 'admin-restok' },
  { label: 'Kelola User', icon: '👥', path: '/admin/users', name: 'admin-users' }
]

const handleLogout = async () => {
  try {
    const api = (await import('../services/api')).default
    await api.post('/logout')
  } catch (error) {
    console.error('Logout API Error:', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}

const isActive = (itemPath) => {
  return route.path === itemPath
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-100">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
      <!-- Logo -->
      <div class="p-5 border-b border-slate-200">
        <router-link to="/dashboard" class="flex items-center gap-2.5 hover:opacity-80 transition">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
            🛒
          </div>
          <div>
            <h1 class="text-sm font-bold text-slate-900">SembakoMart</h1>
            <p class="text-[10px] text-slate-500">Admin Panel</p>
          </div>
        </router-link>
      </div>

      <!-- Menu Items -->
      <nav class="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Menu Admin</p>
        
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            isActive(item.path)
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          ]"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- User Profile & Logout -->
      <div class="border-t border-slate-200 p-4 space-y-3">
        <div class="px-3 py-2 bg-slate-50 rounded-lg">
          <p class="text-xs font-semibold text-slate-700">{{ JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin' }}</p>
          <p class="text-[10px] text-slate-500">Administrator</p>
        </div>
        
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm font-semibold transition-all duration-200 border border-red-200"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col">
      <!-- Top Navbar -->
      <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              {{ $route.meta.title || 'Admin Dashboard' }}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-lg hover:bg-slate-100 transition"
              title="User Profile"
            >
              <span class="text-xl">👤</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-auto p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
aside {
  max-height: 100vh;
}

nav {
  max-height: calc(100vh - 220px);
}
</style>
