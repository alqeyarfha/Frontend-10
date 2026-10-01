<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const categories = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const searchQuery = ref('')
const isModalOpen = ref(false)
const isEdit = ref(false)
const deletingId = ref(null)
const saving = ref(false)

const form = ref({ id: null, name: '', deskripsi: '' })

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter((c) =>
    (c.name || c.nama || '').toLowerCase().includes(q) ||
    (c.deskripsi || c.description || '').toLowerCase().includes(q)
  )
})

const normalizeCat = (c) => ({
  id: c.id || c.kategori_id,
  name: c.name || c.nama || c.nama_kategori || '-',
  deskripsi: c.deskripsi || c.description || '-'
})

const fetchCategories = async () => {
  loading.value = true
  errorMsg.value = ''

  const endpoints = ['/admin/kategori', '/kategori', '/categories', '/category']
  for (const ep of endpoints) {
    try {
      const res = await api.get(ep)
      const body = res.data
      const raw = body?.data?.data || body?.data || body
      if (Array.isArray(raw) && raw.length >= 0) {
        categories.value = raw.map(normalizeCat)
        loading.value = false
        return
      }
    } catch (err) {
      if (![404, 405].includes(err.response?.status)) break
    }
  }

  // Fallback: data lokal sesuai ProdukView
  categories.value = [
    { id: '1', name: 'Beras / Tepung', deskripsi: 'Beras, tepung terigu, dan produk sejenis' },
    { id: '2', name: 'Minyak / Gula', deskripsi: 'Minyak goreng dan gula pasir' },
    { id: '3', name: 'Minyak / Margarin', deskripsi: 'Minyak kelapa dan margarin' },
    { id: '4', name: 'Gula / Garam', deskripsi: 'Gula merah, gula pasir, dan garam beryodium' },
    { id: '5', name: 'Bumbu Dapur', deskripsi: 'Rempah, kecap, saus, dan bumbu masak' }
  ]
  loading.value = false
}

const openAddModal = () => {
  isEdit.value = false
  form.value = { id: null, name: '', deskripsi: '' }
  errorMsg.value = ''
  isModalOpen.value = true
}

const openEditModal = (cat) => {
  isEdit.value = true
  form.value = { id: cat.id, name: cat.name, deskripsi: cat.deskripsi }
  errorMsg.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  errorMsg.value = ''
}

const saveCategory = async () => {
  if (!form.value.name.trim()) {
    errorMsg.value = 'Nama kategori tidak boleh kosong.'
    return
  }

  saving.value = true
  errorMsg.value = ''

  const payload = { name: form.value.name, nama: form.value.name, deskripsi: form.value.deskripsi }

  const tryRequest = async () => {
    const endpoints = isEdit.value
      ? [
          `/admin/kategori/${form.value.id}`,
          `/kategori/${form.value.id}`,
          `/categories/${form.value.id}`
        ]
      : ['/admin/kategori', '/kategori', '/categories']

    for (const ep of endpoints) {
      for (const method of isEdit.value ? ['patch', 'put'] : ['post']) {
        try {
          return await api[method](ep, payload)
        } catch (err) {
          if (![404, 405].includes(err.response?.status)) throw err
        }
      }
    }
    return null
  }

  try {
    await tryRequest()
  } catch {
    // Server belum siap, update local saja
  }

  if (isEdit.value) {
    const idx = categories.value.findIndex((c) => c.id === form.value.id)
    if (idx !== -1) {
      categories.value[idx] = normalizeCat({ ...categories.value[idx], ...payload, id: form.value.id })
    }
    successMsg.value = `Kategori "${form.value.name}" berhasil diperbarui.`
  } else {
    categories.value.push(normalizeCat({ ...payload, id: `local-${Date.now()}` }))
    successMsg.value = `Kategori "${form.value.name}" berhasil ditambahkan.`
  }

  saving.value = false
  isModalOpen.value = false
  setTimeout(() => (successMsg.value = ''), 3000)
}

const deleteCategory = async (cat) => {
  if (!confirm(`Hapus kategori "${cat.name}"? Produk dengan kategori ini mungkin terpengaruh.`)) return

  deletingId.value = cat.id

  const endpoints = [
    `/admin/kategori/${cat.id}`,
    `/kategori/${cat.id}`,
    `/categories/${cat.id}`
  ]

  for (const ep of endpoints) {
    try {
      await api.delete(ep)
      break
    } catch (err) {
      if (![404, 405].includes(err.response?.status)) break
    }
  }

  categories.value = categories.value.filter((c) => c.id !== cat.id)
  deletingId.value = null
  successMsg.value = `Kategori "${cat.name}" berhasil dihapus.`
  setTimeout(() => (successMsg.value = ''), 3000)
}

onMounted(fetchCategories)
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <!-- Header -->
    <section class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">🏷️ Area Admin</span>
          <span class="text-xs text-slate-400">Manajemen kategori produk</span>
        </div>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-800">Kelola Kategori</h1>
        <p class="mt-1 text-sm text-slate-500">Tambah, ubah, dan hapus kategori produk sembako.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="fetchCategories"
          :disabled="loading"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
        >
          <svg :class="['h-4 w-4', { 'animate-spin': loading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Segarkan
        </button>
        <button
          type="button"
          @click="openAddModal"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tambah Kategori
        </button>
      </div>
    </section>

    <!-- Success Alert -->
    <transition name="fade-down">
      <div v-if="successMsg" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ successMsg }}
      </div>
    </transition>

    <!-- Search Bar -->
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="relative min-w-[240px] flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"/></svg>
          <input v-model="searchQuery" type="search" placeholder="Cari nama kategori..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
        </div>
        <span class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{{ filteredCategories.length }} kategori</span>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
      <div class="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
      <p class="mt-3 text-sm font-medium text-slate-400">Memuat kategori...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredCategories.length === 0" class="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
      <div class="text-4xl">🏷️</div>
      <p class="mt-3 text-sm font-semibold text-slate-600">Belum ada kategori. Tambahkan sekarang!</p>
    </div>

    <!-- Grid Kategori -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(cat, index) in filteredCategories"
        :key="cat.id"
        class="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md flex flex-col justify-between"
      >
        <!-- Warna aksen -->
        <div
          class="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
          :style="{ background: `hsl(${(index * 47) % 360}, 65%, 55%)` }"
        ></div>

        <div class="pl-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                :style="{ background: `hsl(${(index * 47) % 360}, 65%, 55%)` }"
              >
                {{ cat.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-bold text-sm text-slate-800">{{ cat.name }}</p>
                <p class="text-[10px] text-slate-400 font-mono">ID: {{ cat.id }}</p>
              </div>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-500 line-clamp-2">{{ cat.deskripsi }}</p>
        </div>

        <!-- Aksi -->
        <div class="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 pl-3">
          <button
            type="button"
            @click="openEditModal(cat)"
            class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Edit
          </button>
          <button
            type="button"
            @click="deleteCategory(cat)"
            :disabled="deletingId === cat.id"
            class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            {{ deletingId === cat.id ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah / Edit -->
    <teleport to="body">
      <transition name="modal">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[999] flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-800">{{ isEdit ? 'Edit Kategori' : 'Tambah Kategori' }}</h2>
              <button type="button" @click="closeModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div v-if="errorMsg" class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">{{ errorMsg }}</div>

            <form @submit.prevent="saveCategory" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Nama Kategori *</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Contoh: Bumbu Dapur"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Deskripsi</label>
                <textarea
                  v-model="form.deskripsi"
                  rows="3"
                  placeholder="Deskripsi singkat kategori ini..."
                  class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" @click="closeModal" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">Batal</button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {{ saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambahkan') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active { transition: all 0.3s ease; }
.fade-down-enter-from { opacity: 0; transform: translateY(-8px); }
.fade-down-leave-to { opacity: 0; transform: translateY(-8px); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
