<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
  // Hapus token & user dari storage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Redirect ke halaman login
  router.push('/login')
}
</script>

<template>
  <nav class="bg-slate-800 text-slate-100 border-b border-slate-700/80 shadow-sm sticky top-0 z-40 font-sans antialiased">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Logo & Brand (Clean SVG Icon) -->
        <div class="flex items-center space-x-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span class="font-bold text-lg tracking-tight text-white">SembakoMart</span>
        </div>

        <!-- Menu Navigasi (Soft Slate Active State) -->
        <div class="flex items-center space-x-1.5 sm:space-x-2">
          <router-link 
            to="/" 
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200"
            :class="route.path === '/' ? 'bg-slate-700 text-white shadow-sm border border-slate-600' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'"
          >
            Beranda
          </router-link>

          <router-link 
            to="/produk" 
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200"
            :class="route.path === '/produk' ? 'bg-slate-700 text-white shadow-sm border border-slate-600' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'"
          >
            Kelola Produk
          </router-link>

          <router-link 
            to="/admin/laporan" 
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200"
            :class="route.path === '/admin/laporan' ? 'bg-slate-700 text-white shadow-sm border border-slate-600' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'"
          >
            📊 Laporan
          </router-link>

          <router-link 
            to="/admin/restok" 
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200"
            :class="route.path === '/admin/restok' ? 'bg-slate-700 text-white shadow-sm border border-slate-600' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'"
          >
            📦 Restok
          </router-link>
        </div>

        <!-- Tombol Logout (Clean Neutral Style) -->
        <div class="flex items-center">
          <button 
            @click="handleLogout" 
            class="rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 border border-slate-600 flex items-center gap-2 shadow-sm"
          >
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>

      </div>
    </div>
  </nav>
</template>