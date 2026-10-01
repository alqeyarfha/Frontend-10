<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import PesanRestokModal from '../components/PesanRestokModal.vue'

const router = useRouter()
const produk = ref([])
const loading = ref(false)
const filterStok = ref('all')
const searchNama = ref('')
const isModalOpen = ref(false)
const selectedProduk = ref(null)

// Sample data untuk demo jika API tidak tersedia
const SAMPLE_PRODUCTS = [
  { id: 1, nama: 'Beras Premium 5kg', kategori: { nama: 'Beras' }, harga: 68000, stok: 25, stok_minimum: 10 },
  { id: 2, nama: 'Minyak Goreng 2L', kategori: { nama: 'Minyak' }, harga: 37000, stok: 0, stok_minimum: 10 },
  { id: 3, nama: 'Garam Halus 1kg', kategori: { nama: 'Bumbu' }, harga: 4000, stok: 8, stok_minimum: 10 },
  { id: 4, nama: 'Gula Pasir 1kg', kategori: { nama: 'Gula' }, harga: 12000, stok: 45, stok_minimum: 15 },
  { id: 5, nama: 'Telur Ayam 10pcs', kategori: { nama: 'Telur' }, harga: 28000, stok: 5, stok_minimum: 10 },
  { id: 6, nama: 'Terigu 1kg', kategori: { nama: 'Tepung' }, harga: 8500, stok: 32, stok_minimum: 10 }
]

onMounted(() => {
  loadRestok()
  // Dengarkan event ketika ada perubahan produk di halaman lain
  window.addEventListener('produk-updated', loadRestok)
})

onUnmounted(() => {
  window.removeEventListener('produk-updated', loadRestok)
})

const loadRestok = async () => {
  loading.value = true
  try {
    // Gunakan endpoint yang sama seperti Kelola Produk
    const response = await api.get('/products')
    const rawData = response.data.data || response.data || []
    
    if (Array.isArray(rawData) && rawData.length > 0) {
      // Normalisasi nama produk (sama dengan ProdukView)
      produk.value = rawData.map(p => ({
        ...p,
        nama: p.nama_produk || p.nama || p.nama_barang || '',
        stok: Number(p.stok || 0),
        stok_minimum: Number(p.stok_minimum || 10),
        harga: Number(p.harga || 0),
        kategori: p.kategori || { nama: 'Umum' }
      }))
    } else {
      produk.value = SAMPLE_PRODUCTS
    }
  } catch (error) {
    console.error('Error memuat produk:', error)
    // Fallback ke sample jika API gagal
    produk.value = SAMPLE_PRODUCTS
  } finally {
    loading.value = false
  }
}

const openPesanModal = (p) => {
  selectedProduk.value = p
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedProduk.value = null
}

const handlePesanSuccess = () => {
  loadRestok()
}

const goToEditProduk = (produkId) => {
  router.push({ path: '/produk', query: { id: produkId, tab: 'edit' } })
}

const filteredProduk = computed(() => {
  return produk.value.filter(p => {
    const stokMin = parseInt(p.stok_minimum || 10)
    const stokSaat = parseInt(p.stok || 0)
    const searchMatch = !searchNama.value || (p.nama || '').toLowerCase().includes(searchNama.value.toLowerCase())

    if (filterStok.value === 'critical') {
      return stokSaat === 0 && searchMatch
    } else if (filterStok.value === 'low') {
      return stokSaat > 0 && stokSaat <= stokMin && searchMatch
    }
    return searchMatch
  })
})

const statistik = computed(() => {
  const critical = produk.value.filter(p => parseInt(p.stok || 0) === 0).length
  const low = produk.value.filter(p => {
    const stok = parseInt(p.stok || 0)
    const stokMin = parseInt(p.stok_minimum || 10)
    return stok > 0 && stok <= stokMin
  }).length
  const aman = produk.value.filter(p => {
    const stok = parseInt(p.stok || 0)
    const stokMin = parseInt(p.stok_minimum || 10)
    return stok > stokMin
  }).length

  return { critical, low, aman }
})

const getStatusBadge = (stok, stokMin = 10) => {
  const s = parseInt(stok || 0)
  const m = parseInt(stokMin)
  if (s === 0) return { label: 'Habis', color: 'bg-red-100 text-red-700 border-red-200' }
  if (s <= m) return { label: 'Menipis', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'Aman', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

const getCategoryName = (kategori) => {
  if (!kategori) return 'Umum'
  if (typeof kategori === 'object') {
    return kategori.nama || kategori.nama_kategori || 'Umum'
  }
  return String(kategori)
}

const formatRupiah = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}
</script>

<template>
  <div class="space-y-6 mx-auto max-w-7xl font-sans antialiased p-4 sm:p-6">
    <!-- Header -->
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">📦 Manajemen Restok</h1>
          <p class="mt-2 text-sm text-slate-600">Pantau ketersediaan stok dan buat pesanan restok produk</p>
        </div>
        <button
          @click="loadRestok"
          :disabled="loading"
          class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
        >
          {{ loading ? '⏳ Memuat...' : '🔄 Refresh' }}
        </button>
      </div>
    </div>

    <!-- Statistik Stok -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-red-700">🚨 Stok Habis</p>
        <p class="mt-2 text-3xl font-bold text-red-900">{{ statistik.critical }}</p>
        <p class="mt-1 text-xs text-red-600">Perlu restok segera</p>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-amber-700">⚠️ Stok Menipis</p>
        <p class="mt-2 text-3xl font-bold text-amber-900">{{ statistik.low }}</p>
        <p class="mt-1 text-xs text-amber-600">Pertimbangkan restok</p>
      </div>

      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-emerald-700">✅ Stok Aman</p>
        <p class="mt-2 text-3xl font-bold text-emerald-900">{{ statistik.aman }}</p>
        <p class="mt-1 text-xs text-emerald-600">Kondisi normal</p>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Filter Status Stok</label>
          <select v-model="filterStok" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="all">Semua Produk</option>
            <option value="critical">Stok Habis (0)</option>
            <option value="low">Stok Menipis</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Cari Produk</label>
          <input 
            v-model="searchNama" 
            type="text" 
            placeholder="Nama produk..." 
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>

    <!-- Tabel Restok -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 mb-4">📊 Data Stok Produk</h2>

      <div v-if="filteredProduk.length === 0" class="text-center py-8">
        <p class="text-slate-500">{{ loading ? 'Memuat...' : 'Tidak ada data produk' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Produk</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Kategori</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700">Stok Saat Ini</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700">Stok Minimum</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Harga</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="p in filteredProduk" 
              :key="p.id" 
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              :class="{ 'bg-red-50': parseInt(p.stok || 0) === 0, 'bg-amber-50': parseInt(p.stok || 0) <= parseInt(p.stok_minimum || 10) && parseInt(p.stok || 0) > 0 }"
            >
              <td class="px-4 py-3 font-medium text-slate-900">{{ p.nama }}</td>
              <td class="px-4 py-3 text-slate-600 text-xs">
                <span class="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1">
                  {{ getCategoryName(p.kategori) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="font-bold text-lg" :class="parseInt(p.stok || 0) === 0 ? 'text-red-600' : parseInt(p.stok || 0) <= parseInt(p.stok_minimum || 10) ? 'text-amber-600' : 'text-emerald-600'">
                  {{ p.stok || 0 }}
                </span>
              </td>
              <td class="px-4 py-3 text-center text-slate-600">{{ p.stok_minimum || 10 }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold border', getStatusBadge(p.stok, p.stok_minimum).color]">
                  {{ getStatusBadge(p.stok, p.stok_minimum).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-medium text-slate-900">{{ formatRupiah(p.harga) }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    v-if="parseInt(p.stok || 0) <= parseInt(p.stok_minimum || 10)"
                    @click="openPesanModal(p)"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                    title="Buat pesanan restok"
                  >
                    📝 Pesan
                  </button>
                  <button 
                    @click="goToEditProduk(p.id)"
                    class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                    title="Edit produk di Kelola Produk"
                  >
                    ✏️ Edit
                  </button>
                  <span v-if="parseInt(p.stok || 0) > parseInt(p.stok_minimum || 10)" class="text-slate-400 text-xs">-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info Restok -->
    <div class="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-blue-900 mb-3">💡 Tips Manajemen Restok</h3>
      <ul class="space-y-2 text-sm text-blue-800">
        <li>• Pantau produk dengan stok menipis secara berkala</li>
        <li>• Buat pesanan restok sebelum produk habis</li>
        <li>• Sesuaikan stok minimum berdasarkan penjualan rata-rata</li>
        <li>• Prioritaskan produk yang sering terjual</li>
      </ul>
    </div>

    <!-- Modal Pesan Restok -->
    <PesanRestokModal 
      :produk="selectedProduk" 
      :is-open="isModalOpen" 
      @close="closeModal"
      @success="handlePesanSuccess"
    />
  </div>
</template>
