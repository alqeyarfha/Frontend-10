<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../services/api'
import { fetchOrders } from '../services/transaksiService'

const users = ref([])
const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')

const normalizeUser = (user, fallback = {}) => ({
  id: user?.id || user?.user_id || fallback.id || `local-${fallback.name || Date.now()}`,
  name: user?.name || user?.nama || user?.nama_pelanggan || fallback.name || 'Pelanggan',
  email: user?.email || fallback.email || '-',
  role: user?.role || 'pembeli',
  no_hp: user?.no_hp || user?.phone || fallback.no_hp || '-',
  alamat: user?.alamat || user?.address || fallback.alamat || '-',
  created_at: user?.created_at || fallback.created_at || null
})

const getCollectionPage = (response) => {
  const body = response?.data || {}
  const candidates = [
    body?.data,
    body?.data?.data,
    body?.data?.users,
    body?.data?.pelanggan,
    body?.data?.customers,
    body?.users,
    body?.pelanggan,
    body?.customers,
    body?.result,
    body
  ]
  const items = candidates.find(Array.isArray) || []
  const pagination = body?.meta || body?.data?.meta || body?.data || body

  return {
    items,
    currentPage: Number(pagination?.current_page || pagination?.currentPage || 1),
    lastPage: Number(pagination?.last_page || pagination?.lastPage || 1),
    nextPage: pagination?.next_page_url || pagination?.nextPage || body?.links?.next || null
  }
}

const fetchAllProfiles = async (endpoint) => {
  const separator = endpoint.includes('?') ? '&' : '?'
  let nextUrl = `${endpoint}${separator}per_page=100`
  let page = 0
  const allItems = []

  while (nextUrl && page < 100) {
    const response = await api.get(nextUrl)
    const result = getCollectionPage(response)
    allItems.push(...result.items)
    page += 1

    if (result.nextPage) {
      nextUrl = result.nextPage
    } else if (result.currentPage < result.lastPage) {
      const pageSeparator = endpoint.includes('?') ? '&' : '?'
      nextUrl = `${endpoint}${pageSeparator}per_page=100&page=${result.currentPage + 1}`
    } else {
      nextUrl = null
    }
  }

  return allItems
}

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return users.value

  return users.value.filter((user) =>
    [user.name, user.email, user.no_hp, user.alamat, user.role]
      .join(' ')
      .toLowerCase()
      .includes(query)
  )
})

const loadUsers = async () => {
  loading.value = true
  errorMessage.value = ''

  const profileMap = new Map()
  const addProfile = (profile, fallback = {}) => {
    if (!profile && !fallback.name) return
    const normalized = normalizeUser(profile, fallback)
    const key = String(
      profile?.email || fallback.email || profile?.id || profile?.user_id || fallback.id || profile?.name || profile?.nama || fallback.name
    ).toLowerCase()
    const existing = profileMap.get(key)
    profileMap.set(key, existing ? normalizeUser({ ...existing, ...normalized }) : normalized)
  }

  const endpoints = ['/admin/users', '/admin/pelanggan', '/users', '/pelanggan', '/customers']
  for (const endpoint of endpoints) {
    try {
      const raw = await fetchAllProfiles(endpoint)
      if (raw.length > 0) {
        raw.forEach((user) => addProfile(user))
      }
    } catch (error) {
      if (![404, 405].includes(error.response?.status)) continue
    }
  }

  try {
    const orders = await fetchOrders(true)
    orders.forEach((order) => {
      const profile = order.user || order.pelanggan || {
        id: order.user_id || order.pelanggan_id,
        name: order.nama_penerima,
        no_hp: order.no_hp,
        alamat: order.alamat,
        created_at: order.created_at
      }
      addProfile(profile, {
        id: order.user_id || order.pelanggan_id,
        name: order.nama_penerima,
        email: order.email || order.user?.email || order.pelanggan?.email,
        no_hp: order.no_hp,
        alamat: order.alamat,
        created_at: order.created_at
      })
    })

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (currentUser.email || currentUser.name) {
      addProfile(currentUser)
    }

    users.value = [...profileMap.values()]
    if (users.value.length === 0) errorMessage.value = 'Endpoint daftar user belum tersedia dan belum ada data profil lokal.'
  } catch (error) {
    errorMessage.value = 'Gagal memuat daftar profil user.'
  } finally {
    loading.value = false
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(loadUsers)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5">
    <section class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">👥 Area Admin</span>
          <span class="text-xs text-slate-400">Manajemen akun</span>
        </div>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-800">Profil Semua User</h1>
        <p class="mt-1 text-sm text-slate-500">Lihat informasi akun pelanggan yang terdaftar di toko.</p>
      </div>
      <button
        type="button"
        @click="loadUsers"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
      >
        <svg :class="['h-4 w-4', { 'animate-spin': loading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Segarkan
      </button>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="relative min-w-[240px] flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"/></svg>
          <input v-model="searchQuery" type="search" placeholder="Cari nama, email, nomor telepon..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
        </div>
        <span class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{{ filteredUsers.length }} user</span>
      </div>
    </section>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
      <div class="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
      <p class="mt-3 text-sm font-medium text-slate-400">Memuat profil user...</p>
    </div>

    <div v-else-if="errorMessage" class="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <p class="text-sm font-semibold text-amber-800">{{ errorMessage }}</p>
      <p class="mt-1 text-xs text-amber-700">Tambahkan endpoint GET /users atau GET /pelanggan di backend untuk menampilkan semua akun.</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
      <div class="text-4xl">👤</div>
      <p class="mt-3 text-sm font-semibold text-slate-600">Profil user tidak ditemukan.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="user in filteredUsers" :key="user.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
        <div class="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-sm">{{ user.name.charAt(0).toUpperCase() }}</div>
          <div class="min-w-0">
            <h2 class="truncate font-bold text-slate-800">{{ user.name }}</h2>
            <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
          </div>
          <span class="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold capitalize text-emerald-700">{{ user.role }}</span>
        </div>
        <dl class="mt-4 space-y-2 text-xs">
          <div class="flex gap-3"><dt class="w-20 shrink-0 text-slate-400">Telepon</dt><dd class="font-medium text-slate-700">{{ user.no_hp }}</dd></div>
          <div class="flex gap-3"><dt class="w-20 shrink-0 text-slate-400">Alamat</dt><dd class="line-clamp-2 font-medium text-slate-700">{{ user.alamat }}</dd></div>
          <div class="flex gap-3"><dt class="w-20 shrink-0 text-slate-400">Terdaftar</dt><dd class="font-medium text-slate-700">{{ formatDate(user.created_at) }}</dd></div>
        </dl>
      </article>
    </div>
  </div>
</template>
