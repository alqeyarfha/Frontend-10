<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { getAllTransactions } from '../services/transaksiService'
import { generateSalesReport } from '../utils/dataSync'

const transaksi = ref([])
const loading = ref(false)
const filterBulan = ref(new Date().getMonth() + 1)
const filterTahun = ref(new Date().getFullYear())
const searchProduk = ref('')

onMounted(() => {
  loadLaporan()
})

const loadLaporan = async () => {
  loading.value = true
  try {
    transaksi.value = await getAllTransactions()
  } catch (error) {
    console.error('Error dari transaksiService:', error)
    try {
      const response = await api.get('/transaksi')
      transaksi.value = response.data.data || response.data || []
    } catch (apiError) {
      console.error('Gagal memuat laporan dari API:', apiError)
      transaksi.value = []
    }
  } finally {
    loading.value = false
  }
}

const filteredTransaksi = computed(() => {
  return transaksi.value.filter(t => {
    const tanggal = new Date(t.tanggal || t.created_at)
    const bulanMatch = tanggal.getMonth() + 1 === parseInt(filterBulan.value)
    const tahunMatch = tanggal.getFullYear() === parseInt(filterTahun.value)
    return bulanMatch && tahunMatch
  })
})

const totalPenjualan = computed(() => {
  return filteredTransaksi.value.reduce((sum, t) => sum + (parseFloat(t.total_harga) || 0), 0)
})

const totalTransaksi = computed(() => {
  return filteredTransaksi.value.length
})

const rataRataPenjualan = computed(() => {
  return totalTransaksi.value > 0 ? totalPenjualan.value / totalTransaksi.value : 0
})

const topProduk = computed(() => {
  const produkMap = {}
  filteredTransaksi.value.forEach(t => {
    if (t.items && Array.isArray(t.items)) {
      t.items.forEach(item => {
        const nama = item.nama_produk || 'Produk'
        if (!produkMap[nama]) {
          produkMap[nama] = { nama, qty: 0, total: 0 }
        }
        produkMap[nama].qty += parseInt(item.jumlah) || 0
        produkMap[nama].total += parseFloat(item.harga) * parseInt(item.jumlah) || 0
      })
    }
  })
  
  return Object.values(produkMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .filter(p => !searchProduk.value || p.nama.toLowerCase().includes(searchProduk.value.toLowerCase()))
})

const formatRupiah = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

const formatTanggal = (tanggal) => {
  return new Date(tanggal).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6 mx-auto max-w-7xl font-sans antialiased p-4 sm:p-6">
    <!-- Header -->
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">📊 Laporan Penjualan</h1>
          <p class="mt-2 text-sm text-slate-600">Analisis performa penjualan toko sembako Anda</p>
        </div>
        <button
          @click="loadLaporan"
          :disabled="loading"
          class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
        >
          {{ loading ? '⏳ Memuat...' : '🔄 Refresh' }}
        </button>
      </div>

      <!-- Filter -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Bulan</label>
          <select v-model="filterBulan" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Tahun</label>
          <input v-model="filterTahun" type="number" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-emerald-700">Total Penjualan</p>
        <p class="mt-2 text-2xl font-bold text-emerald-900">{{ formatRupiah(totalPenjualan) }}</p>
        <p class="mt-1 text-xs text-emerald-600">Periode {{ filterBulan }}/{{ filterTahun }}</p>
      </div>

      <div class="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-sky-700">Jumlah Transaksi</p>
        <p class="mt-2 text-2xl font-bold text-sky-900">{{ totalTransaksi }}</p>
        <p class="mt-1 text-xs text-sky-600">Pesanan berhasil</p>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
        <p class="text-sm font-medium text-amber-700">Rata-rata Transaksi</p>
        <p class="mt-2 text-2xl font-bold text-amber-900">{{ formatRupiah(rataRataPenjualan) }}</p>
        <p class="mt-1 text-xs text-amber-600">Per pesanan</p>
      </div>
    </div>

    <!-- Top Produk Terjual -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-bold text-slate-900">🔥 Top 10 Produk Terjual</h2>
        <input 
          v-model="searchProduk" 
          type="text" 
          placeholder="Cari produk..." 
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs"
        />
      </div>

      <div v-if="topProduk.length === 0" class="text-center py-8">
        <p class="text-slate-500">Belum ada data penjualan</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Produk</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Qty Terjual</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Total Penjualan</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">% dari Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(produk, idx) in topProduk" :key="idx" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 font-medium text-slate-900">{{ produk.nama }}</td>
              <td class="px-4 py-3 text-right text-slate-600">{{ produk.qty }}</td>
              <td class="px-4 py-3 text-right text-slate-900 font-semibold">{{ formatRupiah(produk.total) }}</td>
              <td class="px-4 py-3 text-right text-slate-600">{{ ((produk.total / totalPenjualan) * 100).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Riwayat Transaksi Detail -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 mb-4">📋 Riwayat Transaksi</h2>

      <div v-if="filteredTransaksi.length === 0" class="text-center py-8">
        <p class="text-slate-500">Tidak ada transaksi di periode ini</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200 bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Pelanggan</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Jumlah Item</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTransaksi" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 text-slate-600">{{ formatTanggal(t.tanggal || t.created_at) }}</td>
              <td class="px-4 py-3 font-medium text-slate-900">{{ t.nama_pelanggan || t.user?.name || 'Guest' }}</td>
              <td class="px-4 py-3 text-right text-slate-600">{{ (t.items?.length || 0) }}</td>
              <td class="px-4 py-3 text-right text-slate-900 font-semibold">{{ formatRupiah(t.total_harga) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
