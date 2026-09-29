<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchOrders, uploadBuktiTransaksi, getProofImageUrl, removeOrderHistory } from '../services/transaksiService'

const orders = ref([])
const loading = ref(true)

// State Modal Preview Bukti Pembayaran
const previewModalOpen = ref(false)
const previewImageUrl = ref('')
const previewOrderTitle = ref('')

// State Modal Upload Bukti Pembayaran
const uploadModalOpen = ref(false)
const selectedOrder = ref(null)
const uploadImageBase64 = ref('')
const uploadFileObj = ref(null)
const uploading = ref(false)

const canDeleteOrder = (order) => String(order?.status || 'pending').toLowerCase() !== 'pending'

const getOrderItems = (order) => {
  const items = order?.items || order?.order_items || order?.transaksi_items || order?.products || order?.detail || order?.data || []
  if (Array.isArray(items)) return items
  if (items && typeof items === 'object') return [items]
  return []
}

const formatCurrency = (value) => {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

const getStatusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') {
    return 'bg-amber-100 text-amber-800 border border-amber-200'
  }
  if (s === 'terverifikasi') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  if (s === 'sedang_dikirim' || s === 'diproses') {
    return 'bg-blue-100 text-blue-800 border border-blue-200'
  }
  if (s === 'sudah_di_tempat' || s === 'sudah di tempat') {
    return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  }
  if (s === 'ditolak') {
    return 'bg-rose-100 text-rose-800 border border-rose-200'
  }
  if (s === 'diterima' || s === 'selesai') {
    return 'bg-slate-100 text-slate-800 border border-slate-300'
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

const getStatusLabel = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'Menunggu Verifikasi Admin'
  if (s === 'terverifikasi') return 'Terverifikasi (Pembayaran Diterima)'
  if (s === 'sedang_dikirim' || s === 'diproses') return 'Sedang Dikirim'
  if (s === 'sudah_di_tempat' || s === 'sudah di tempat') return 'Sudah di Tempat'
  if (s === 'ditolak') return 'Ditolak'
  if (s === 'diterima' || s === 'selesai') return 'Diterima'
  return status || 'Pending'
}

const loadOrdersData = async () => {
  loading.value = true
  try {
    orders.value = await fetchOrders(false)
  } catch (err) {
    console.error('Gagal memuat riwayat:', err)
  } finally {
    loading.value = false
  }
}

// Buka modal pratinjau gambar bukti
const openProofPreview = (proofUrl, orderId) => {
  previewImageUrl.value = getProofImageUrl(proofUrl)
  previewOrderTitle.value = `Bukti Pembayaran Pesanan #${orderId}`
  previewModalOpen.value = true
}

const closeProofPreview = () => {
  previewModalOpen.value = false
  previewImageUrl.value = ''
}

// Buka modal upload bukti
const openUploadModal = (order) => {
  selectedOrder.value = order
  uploadImageBase64.value = ''
  uploadFileObj.value = null
  uploadModalOpen.value = true
}

const closeUploadModal = () => {
  uploadModalOpen.value = false
  selectedOrder.value = null
  uploadImageBase64.value = ''
  uploadFileObj.value = null
}

const handleProofFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Harap pilih file gambar (JPG, PNG, dsb).')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran gambar terlalu besar! Maksimal 5 MB.')
    event.target.value = ''
    return
  }

  uploadFileObj.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadImageBase64.value = e.target?.result || ''
  }
  reader.readAsDataURL(file)
}

const submitUploadProof = async () => {
  if (!uploadImageBase64.value || !selectedOrder.value) {
    alert('Silakan pilih foto bukti pembayaran terlebih dahulu.')
    return
  }

  uploading.value = true
  try {
    await uploadBuktiTransaksi(selectedOrder.value.id, uploadImageBase64.value, uploadFileObj.value)
    alert('Bukti pembayaran berhasil diunggah! Admin akan segera memverifikasi pesanan Anda.')
    closeUploadModal()
    await loadOrdersData()
  } catch (err) {
    console.error('Gagal upload bukti:', err)
    alert('Gagal mengunggah bukti pembayaran. Silakan coba lagi.')
  } finally {
    uploading.value = false
  }
}

const handleDeleteOrder = (order) => {
  if (!order?.id || !canDeleteOrder(order)) return

  const confirmed = window.confirm(`Hapus transaksi #${order.id} dari riwayat?`)
  if (!confirmed) return

  removeOrderHistory([order.id])
  orders.value = orders.value.filter((item) => String(item.id) !== String(order.id))
}

onMounted(() => {
  loadOrdersData()
  window.addEventListener('transaksi-updated', loadOrdersData)
})

onUnmounted(() => {
  window.removeEventListener('transaksi-updated', loadOrdersData)
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <!-- Header -->
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">🧾 Riwayat Belanja</span>
          <h2 class="mt-2 text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
          <p class="text-sm text-slate-500 mt-0.5">Pantau status pesanan dan bukti pembayaran Anda</p>
        </div>
        <button
          @click="loadOrdersData"
          class="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition flex items-center gap-2 shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center">
      <div class="inline-flex flex-col items-center gap-3">
        <div class="h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
        <p class="text-slate-400 text-sm font-medium">Memuat riwayat transaksi...</p>
      </div>
    </div>

    <div v-else-if="orders.length === 0" class="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm space-y-4">
      <div class="text-5xl">🛍️</div>
      <p class="font-bold text-slate-700 text-base">Belum ada riwayat transaksi</p>
      <p class="text-xs text-slate-400">Silakan belanja kebutuhan dapur dan sembako favorit Anda sekarang.</p>
      <router-link to="/" class="inline-block mt-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm">
        🛒 Mulai Belanja
      </router-link>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id || Math.random()"
        class="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        <!-- Header Kartu Pesanan -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-slate-900 text-sm">#{{ order.id || '-' }}</span>
            <span class="text-slate-300">•</span>
            <span class="text-slate-400">
              {{ order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-' }}
            </span>
          </div>

          <button
            v-if="canDeleteOrder(order)"
            type="button"
            @click="handleDeleteOrder(order)"
            class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
            title="Hapus transaksi dari riwayat"
          >
            🗑️ Hapus
          </button>

          <!-- Status Badge -->
          <span :class="['inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide border', getStatusBadgeClass(order.status)]">
            <span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
            {{ getStatusLabel(order.status) }}
          </span>
        </div>

        <!-- Rincian Nilai & Produk -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Total Tagihan</p>
            <p class="text-xl font-black text-slate-900">{{ formatCurrency(order.total_harga || order.total || 0) }}</p>
          </div>
          <div class="text-right">
            <span :class="[
              'inline-block rounded-xl px-3 py-1.5 text-xs font-bold',
              (order.metode_pembayaran || 'transfer').toLowerCase().includes('transfer')
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-orange-100 text-orange-700 border border-orange-200'
            ]">
              {{ order.metode_pembayaran === 'transfer' ? '💳 Transfer Bank / QRIS' : ('🏠 ' + (order.metode_pembayaran || 'COD')) }}
            </span>
          </div>
        </div>

        <!-- Daftar Produk -->
        <div v-if="getOrderItems(order).length" class="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">🛒 Rincian Barang</p>
          <div
            v-for="(item, index) in getOrderItems(order)"
            :key="index"
            class="flex items-center justify-between text-xs text-slate-700"
          >
            <span class="font-medium">• {{ item.nama_produk || item.nama || item.product_name || 'Produk' }}</span>
            <span class="font-bold text-emerald-600">{{ item.qty || item.jumlah || 1 }}x</span>
          </div>
        </div>

        <!-- Section Bukti Transaksi -->
        <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <span class="text-lg">🧾</span>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800">Bukti Pembayaran Transaksi</p>
                <p class="text-[11px] mt-0.5">
                  <span v-if="order.bukti_transaksi" class="text-emerald-600 font-semibold">✅ Bukti pembayaran telah dilampirkan</span>
                  <span v-else-if="order.status === 'pending'" class="text-amber-600 font-semibold">⚠️ Belum ada bukti transfer yang diunggah</span>
                  <span v-else class="text-slate-400">Tidak ada bukti pembayaran</span>
                </p>
              </div>
            </div>

            <!-- Tombol Aksi Bukti -->
            <div class="flex items-center gap-2">
              <button
                v-if="order.bukti_transaksi"
                type="button"
                @click="openProofPreview(order.bukti_transaksi, order.id)"
                class="inline-flex items-center gap-1.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 px-3.5 py-2 text-xs font-bold shadow-sm transition"
              >
                👁️ Lihat Bukti
              </button>

              <button
                v-if="order.status === 'pending'"
                type="button"
                @click="openUploadModal(order)"
                class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition"
              >
                📤 {{ order.bukti_transaksi ? 'Ganti Bukti' : 'Upload Bukti' }}
              </button>
            </div>
          </div>

          <!-- Thumbnail Pratinjau Kecil jika sudah ada bukti -->
          <div v-if="order.bukti_transaksi" class="mt-3 flex items-center gap-3 pt-3 border-t border-slate-200">
            <img
              :src="getProofImageUrl(order.bukti_transaksi)"
              alt="Bukti Transfer"
              @click="openProofPreview(order.bukti_transaksi, order.id)"
              class="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm cursor-pointer hover:scale-105 hover:border-emerald-500 transition"
            />
            <div class="text-[11px] text-slate-500">
              <span class="block font-bold text-slate-700">Foto Bukti Transfer</span>
              <span>Klik gambar untuk memperbesar</span>
            </div>
          </div>

          <!-- Pesan khusus jika status sudah terverifikasi -->
          <div v-if="order.status === 'terverifikasi'" class="mt-3 text-[11px] text-emerald-800 bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-2">
            <span>✅</span>
            <span>Pembayaran Anda telah <strong>diverifikasi oleh Admin</strong>. Pesanan sedang dipersiapkan untuk dikirim!</span>
          </div>
        </div>

        <div v-if="order.catatan" class="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 italic">
          💬 Catatan: "{{ order.catatan }}"
        </div>
      </div>
    </div>

    <!-- MODAL PREVIEW BUKTI TRANSAKSI (LIGHTBOX) -->
    <div
      v-if="previewModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="closeProofPreview"
    >
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">🧾 {{ previewOrderTitle }}</h3>
            <p class="text-[11px] text-slate-400">Struk bukti pembayaran Anda</p>
          </div>
          <button
            @click="closeProofPreview"
            class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="max-h-[70vh] overflow-auto rounded-2xl bg-slate-100 p-2 flex items-center justify-center">
          <img
            :src="previewImageUrl"
            alt="Foto Bukti Pembayaran"
            class="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
          />
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            @click="closeProofPreview"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL UPLOAD BUKTI TRANSAKSI -->
    <div
      v-if="uploadModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="closeUploadModal"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-bold text-slate-800 text-base">📤 Unggah Bukti Pembayaran</h3>
            <p class="text-xs text-slate-400 mt-0.5">Pesanan #{{ selectedOrder?.id }}</p>
          </div>
          <button
            @click="closeUploadModal"
            class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">Pilih Foto Struk / Bukti Transfer</label>

          <!-- Input File -->
          <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 p-6 hover:border-emerald-400 hover:bg-emerald-50/50 transition bg-slate-50">
            <input
              type="file"
              id="upload-proof-input"
              accept="image/*"
              @change="handleProofFileSelect"
              class="hidden"
            />
            <label
              for="upload-proof-input"
              class="flex flex-col items-center justify-center cursor-pointer text-center space-y-2"
            >
              <span class="text-4xl">📷</span>
              <span class="text-sm font-bold text-slate-700">Pilih Gambar Bukti</span>
              <span class="text-[11px] text-slate-400">JPG, PNG, atau WEBP (Maksimal 5MB)</span>
            </label>
          </div>

          <!-- Preview Gambar Terpilih -->
          <div v-if="uploadImageBase64" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
            <img :src="uploadImageBase64" alt="Pratinjau" class="h-16 w-16 rounded-xl object-cover border-2 border-emerald-300 shadow-sm" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-emerald-800">✓ Gambar Siap Dikirim</p>
              <p class="text-[11px] text-emerald-600 truncate">{{ uploadFileObj?.name || 'bukti-transfer.jpg' }}</p>
            </div>
            <button
              type="button"
              @click="uploadImageBase64 = ''; uploadFileObj = null"
              class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition"
            >
              Hapus
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            @click="closeUploadModal"
            class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="!uploadImageBase64 || uploading"
            @click="submitUploadProof"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {{ uploading ? '⏳ Mengunggah...' : '📤 Kirim Bukti Pembayaran' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>