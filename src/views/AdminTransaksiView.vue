<template>
  <div class="space-y-6 mx-auto max-w-6xl">
    <!-- Header Halaman -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 border border-emerald-200">🛡️ Area Admin</span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500 text-xs font-medium">Manajemen Pesanan</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mt-1.5">Pusat Verifikasi & Kelola Transaksi</h2>
        <p class="text-xs text-slate-500 mt-0.5">Periksa bukti pembayaran transfer dari pembeli dan verifikasi pesanan agar segera diproses.</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="loadOrders"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all flex items-center gap-2"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Segarkan
        </button>
        <button
          @click="handleClearHistory"
          :disabled="historyOrders.length === 0 || loading"
          class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          title="Hapus transaksi yang sudah diproses dari riwayat lokal"
        >
          🗑️ Hapus Riwayat
          <span v-if="historyOrders.length > 0" class="rounded-full bg-rose-200 px-1.5 py-0.5 text-[10px]">{{ historyOrders.length }}</span>
        </button>
        <router-link
          to="/dashboard"
          class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          📊 Ke Dashboard
        </router-link>
      </div>
    </div>

    <!-- Bar Pencarian & Filter Status -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Input Pencarian -->
        <div class="relative flex-1 min-w-[240px] max-w-md">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari ID pesanan, nama pembeli, atau catatan..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <!-- Filter Tab Buttons -->
        <div class="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs">
          <button
            @click="activeStatusFilter = 'semua'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            Semua ({{ allOrders.length }})
          </button>
          <button
            @click="activeStatusFilter = 'pending'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200 flex items-center gap-1.5', activeStatusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            <span>⏳ Pending</span>
            <span v-if="countPending > 0" class="rounded-full bg-white/30 px-1.5 text-[10px] font-bold">{{ countPending }}</span>
          </button>
          <button
            @click="activeStatusFilter = 'terverifikasi'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'terverifikasi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            ✅ Terverifikasi ({{ countVerified }})
          </button>
          <button
            @click="activeStatusFilter = 'sedang_dikirim'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'sedang_dikirim' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            🚚 Dikirim ({{ countShipping }})
          </button>
          <button
            @click="activeStatusFilter = 'sudah_di_tempat'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'sudah_di_tempat' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            📍 Di Tempat ({{ countAtLocation }})
          </button>
          <button
            @click="activeStatusFilter = 'diterima'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'diterima' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            ✅ Diterima ({{ countCompleted }})
          </button>
          <button
            @click="activeStatusFilter = 'ditolak'"
            :class="['px-3.5 py-2 rounded-xl font-bold transition-all duration-200', activeStatusFilter === 'ditolak' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60']"
          >
            ✕ Ditolak ({{ countRejected }})
          </button>
        </div>
      </div>
    </div>

    <!-- Alert jika ada pesanan pending -->
    <div v-if="countPending > 0 && activeStatusFilter !== 'pending'" class="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 text-amber-800">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200">
          <span class="text-lg">⚠️</span>
        </div>
        <div>
          <span class="font-bold text-sm">Ada {{ countPending }} pesanan menunggu verifikasi!</span>
          <p class="text-xs text-amber-700 mt-0.5">Silakan periksa bukti transfer dan klik tombol verifikasi agar pesanan dapat diproses.</p>
        </div>
      </div>
      <button
        @click="activeStatusFilter = 'pending'"
        class="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 font-bold text-xs transition shadow-sm hover:shadow whitespace-nowrap"
      >
        Tampilkan Pending
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center">
      <div class="inline-flex flex-col items-center gap-3">
        <div class="h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
        <p class="text-slate-400 text-sm font-medium">Memuat data transaksi...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="rounded-2xl border border-slate-200 bg-white p-16 text-center">
      <div class="text-5xl mb-4">📭</div>
      <p class="font-bold text-slate-600 text-base">Tidak ada data transaksi yang sesuai.</p>
      <p class="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau ubah filter status di atas.</p>
    </div>

    <!-- Tabel Data Transaksi -->
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 text-[11px] font-bold tracking-wider">
            <tr>
              <th class="p-4">ID & Waktu</th>
              <th class="p-4">Pelanggan</th>
              <th class="p-4">Total & Metode</th>
              <th class="p-4 text-center">Bukti Pembayaran</th>
              <th class="p-4 text-center">Status</th>
              <th class="p-4 text-center">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              :class="['transition-colors hover:bg-slate-50/50', order.status === 'pending' ? 'bg-amber-50/30' : '']"
            >
              <!-- ID & Waktu -->
              <td class="p-4">
                <div class="font-bold text-slate-900 text-sm">#{{ order.id }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  {{ order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-' }}
                </div>
              </td>

              <!-- Pelanggan -->
              <td class="p-4">
                <div class="font-bold text-slate-800">{{ getCustomerName(order) }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ order.no_hp || order.user?.no_hp || '-' }}</div>
                <div v-if="order.catatan" class="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[170px]" :title="order.catatan">
                  "{{ order.catatan }}"
                </div>
              </td>

              <!-- Total Belanja & Metode Bayar -->
              <td class="p-4">
                <div class="font-bold text-slate-900 text-sm">
                  Rp {{ Number(order.total_harga || order.total || 0).toLocaleString('id-ID') }}
                </div>
                <span :class="[
                  'inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase mt-1',
                  (order.metode_pembayaran || 'transfer').toLowerCase().includes('transfer')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                ]">
                  {{ order.metode_pembayaran === 'transfer' ? '💳 Transfer Bank' : (order.metode_pembayaran ? `🏠 ${order.metode_pembayaran}` : '🏠 COD') }}
                </span>
              </td>

              <!-- Bukti Pembayaran (Foto Struk) -->
              <td class="p-4 text-center">
                <div v-if="order.bukti_transaksi" class="flex flex-col items-center gap-1.5">
                  <img
                    :src="getProofImageUrl(order.bukti_transaksi)"
                    alt="Bukti Transfer"
                    @click="openProofPreview(order.bukti_transaksi, order.id)"
                    class="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition hover:border-emerald-500"
                  />
                  <button
                    type="button"
                    @click="openProofPreview(order.bukti_transaksi, order.id)"
                    class="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-lg transition"
                  >
                    👁 Lihat Foto
                  </button>
                </div>
                <div v-else class="text-slate-300 text-[11px] italic">
                  Belum ada bukti
                </div>
              </td>

              <!-- Status Badge -->
              <td class="p-4 text-center">
                <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide border', getStatusBadgeClass(order.status)]">
                  <span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>

              <!-- Aksi Verifikasi -->
              <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                  <!-- Aksi jika Pending -->
                  <template v-if="order.status === 'pending'">
                    <button
                      type="button"
                      :disabled="actionLoadingId === order.id"
                      @click="handleVerify(order.id, 'terverifikasi')"
                      class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                      title="Setujui & Verifikasi Pembayaran"
                    >
                      ✓ Verifikasi
                    </button>
                    <button
                      type="button"
                      :disabled="actionLoadingId === order.id"
                      @click="handleVerify(order.id, 'ditolak')"
                      class="rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 px-3 py-2 font-bold text-xs transition disabled:opacity-50"
                      title="Tolak Pembayaran"
                    >
                      ✕ Tolak
                    </button>
                  </template>

                  <!-- Aksi mengikuti alur pengiriman -->
                  <template v-else-if="order.status === 'terverifikasi'">
                    <button
                      type="button"
                      :disabled="actionLoadingId === order.id"
                      @click="handleVerify(order.id, 'sedang_dikirim')"
                      class="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-3.5 py-2 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                      title="Tandai barang sedang dikirim"
                    >
                      🚚 Mulai Kirim
                    </button>
                  </template>
                  <template v-else-if="order.status === 'sedang_dikirim'">
                    <button
                      type="button"
                      :disabled="actionLoadingId === order.id"
                      @click="handleVerify(order.id, 'sudah_di_tempat')"
                      class="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-2 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                      title="Tandai barang sudah sampai di tempat"
                    >
                      📍 Sudah di Tempat
                    </button>
                  </template>
                  <template v-else-if="order.status === 'sudah_di_tempat'">
                    <button
                      type="button"
                      :disabled="actionLoadingId === order.id"
                      @click="handleVerify(order.id, 'diterima')"
                      class="rounded-xl bg-slate-600 hover:bg-slate-700 text-white px-3.5 py-2 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                      title="Tandai barang sudah diterima pelanggan"
                    >
                      ✅ Tandai Diterima
                    </button>
                  </template>

                  <!-- Tombol Rincian -->
                  <button
                    type="button"
                    @click="openOrderDetail(order)"
                    class="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 px-3 py-2 font-bold text-xs transition-all shadow-sm hover:shadow"
                    title="Buka rincian lengkap pesanan"
                  >
                    📋 Detail
                  </button>
                  <button
                    v-if="order.status !== 'pending'"
                    type="button"
                    @click="handleDeleteOrder(order)"
                    class="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 px-3 py-2 font-bold text-xs transition-all"
                    title="Hapus transaksi dari riwayat"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PREVIEW GAMBAR BUKTI TRANSAKSI (LIGHTBOX) -->
    <div
      v-if="previewModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="closeProofPreview"
    >
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">🧾 {{ previewOrderTitle }}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Struk bukti pembayaran transfer dari pembeli</p>
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
            alt="Bukti Transfer"
            class="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
          />
        </div>

        <div class="flex items-center justify-between pt-1">
          <div v-if="selectedPreviewOrder && selectedPreviewOrder.status === 'pending'">
            <button
              type="button"
              @click="handleVerify(selectedPreviewOrder.id, 'terverifikasi'); closeProofPreview()"
              class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
            >
              ✓ Verifikasi Pesanan Ini Sekarang
            </button>
          </div>
          <div v-else></div>
          <button
            type="button"
            @click="closeProofPreview"
            class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL LENGKAP PESANAN -->
    <div
      v-if="detailModalOpen && selectedDetailOrder"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="detailModalOpen = false"
    >
      <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-bold text-slate-800 text-base">🧾 Rincian Transaksi #{{ selectedDetailOrder.id }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Waktu: {{ selectedDetailOrder.created_at ? new Date(selectedDetailOrder.created_at).toLocaleString('id-ID') : '-' }}
            </p>
          </div>
          <button
            @click="detailModalOpen = false"
            class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Info Pembeli -->
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
          <p class="font-bold text-slate-800 text-sm">👤 {{ getCustomerName(selectedDetailOrder) }}</p>
          <p class="text-slate-600">📱 {{ selectedDetailOrder.no_hp || selectedDetailOrder.user?.no_hp || '-' }}</p>
          <p class="text-slate-600">📍 {{ selectedDetailOrder.alamat || selectedDetailOrder.user?.alamat || 'Belum diatur' }}</p>
          <p v-if="selectedDetailOrder.catatan" class="text-slate-500 italic">💬 "{{ selectedDetailOrder.catatan }}"</p>
        </div>

        <!-- Rincian Produk Pesanan -->
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">🛒 Daftar Barang Belanja</p>
          <div class="max-h-44 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 p-3 text-xs">
            <div
              v-for="(item, idx) in getOrderItems(selectedDetailOrder)"
              :key="idx"
              class="py-2.5 flex items-center justify-between"
            >
              <div>
                <span class="font-semibold text-slate-800">{{ item.nama_produk || item.nama || item.product_name || 'Produk' }}</span>
                <span class="text-slate-400 text-[11px] ml-2">x{{ item.qty || item.jumlah || 1 }}</span>
              </div>
              <span class="font-bold text-emerald-600">
                Rp {{ ((Number(item.harga || 0)) * Number(item.qty || item.jumlah || 1)).toLocaleString('id-ID') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Bukti Pembayaran di Modal Detail -->
        <div class="rounded-2xl border border-slate-200 p-4 flex items-center justify-between bg-slate-50">
          <div>
            <p class="text-xs font-bold text-slate-800">📸 Bukti Pembayaran</p>
            <p class="text-[11px] text-slate-500 mt-0.5">
              {{ selectedDetailOrder.bukti_transaksi ? 'Foto struk telah dilampirkan' : 'Belum diunggah oleh pembeli' }}
            </p>
          </div>
          <div v-if="selectedDetailOrder.bukti_transaksi">
            <button
              type="button"
              @click="openProofPreview(selectedDetailOrder.bukti_transaksi, selectedDetailOrder.id)"
              class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold transition shadow-sm"
            >
              👁 Lihat Bukti Foto
            </button>
          </div>
        </div>

        <!-- Total Tagihan & Aksi -->
        <div class="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span class="block text-[11px] text-slate-400 uppercase font-bold tracking-wide">Total Pembayaran</span>
            <span class="text-2xl font-black text-slate-900">
              Rp {{ Number(selectedDetailOrder.total_harga || selectedDetailOrder.total || 0).toLocaleString('id-ID') }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="selectedDetailOrder.status === 'pending'"
              type="button"
              @click="handleVerify(selectedDetailOrder.id, 'terverifikasi'); detailModalOpen = false"
              class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
            >
              ✓ Verifikasi Sekarang
            </button>
            <button
              type="button"
              @click="detailModalOpen = false"
              class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchOrders, verifikasiTransaksi, getProofImageUrl, removeOrderHistory } from '../services/transaksiService'

const allOrders = ref([])
const loading = ref(true)
const activeStatusFilter = ref('semua')
const searchQuery = ref('')
const actionLoadingId = ref(null)

// State Modal Preview Bukti
const previewModalOpen = ref(false)
const previewImageUrl = ref('')
const previewOrderTitle = ref('')
const selectedPreviewOrder = ref(null)

// State Modal Detail Pesanan
const detailModalOpen = ref(false)
const selectedDetailOrder = ref(null)

const countPending = computed(() => allOrders.value.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length)
const countVerified = computed(() => allOrders.value.filter((o) => (o.status || '').toLowerCase() === 'terverifikasi').length)
const countShipping = computed(() => allOrders.value.filter((o) => (o.status || '').toLowerCase() === 'sedang_dikirim').length)
const countAtLocation = computed(() => allOrders.value.filter((o) => (o.status || '').toLowerCase() === 'sudah_di_tempat').length)
const countCompleted = computed(() => allOrders.value.filter((o) => (o.status || '').toLowerCase() === 'diterima').length)
const countRejected = computed(() => allOrders.value.filter((o) => (o.status || '').toLowerCase() === 'ditolak').length)
const historyOrders = computed(() => allOrders.value.filter((order) => (order.status || 'pending').toLowerCase() !== 'pending'))

// Filter berdasarkan status dan search bar
const filteredOrders = computed(() => {
  let list = allOrders.value

  if (activeStatusFilter.value !== 'semua') {
    list = list.filter((o) => (o.status || 'pending').toLowerCase() === activeStatusFilter.value.toLowerCase())
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((o) => {
      const orderId = String(o.id || '').toLowerCase()
      const customer = getCustomerName(o).toLowerCase()
      const phone = String(o.no_hp || o.user?.no_hp || '').toLowerCase()
      const note = String(o.catatan || '').toLowerCase()
      return orderId.includes(q) || customer.includes(q) || phone.includes(q) || note.includes(q)
    })
  }

  return list
})

const getCustomerName = (order) => {
  return order.nama_penerima || order.user?.name || order.pelanggan?.nama || 'Pelanggan'
}

const getOrderItems = (order) => {
  const items = order?.items || order?.order_items || order?.transaksi_items || order?.products || order?.detail || []
  if (Array.isArray(items)) return items
  if (items && typeof items === 'object') return [items]
  return []
}

const getStatusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (s === 'terverifikasi') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'sedang_dikirim') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (s === 'sudah_di_tempat') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  if (s === 'ditolak') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (s === 'diterima') return 'bg-slate-50 text-slate-700 border-slate-300'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

const getStatusLabel = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'Pending'
  if (s === 'terverifikasi') return 'Terverifikasi'
  if (s === 'sedang_dikirim') return 'Sedang Dikirim'
  if (s === 'sudah_di_tempat') return 'Sudah di Tempat'
  if (s === 'ditolak') return 'Ditolak'
  if (s === 'diterima') return 'Diterima'
  return status || 'Pending'
}

const openProofPreview = (proofUrl, orderId) => {
  previewImageUrl.value = getProofImageUrl(proofUrl)
  previewOrderTitle.value = `Bukti Pembayaran Pesanan #${orderId}`
  selectedPreviewOrder.value = allOrders.value.find((o) => String(o.id) === String(orderId)) || null
  previewModalOpen.value = true
}

const closeProofPreview = () => {
  previewModalOpen.value = false
  previewImageUrl.value = ''
  selectedPreviewOrder.value = null
}

const openOrderDetail = (order) => {
  selectedDetailOrder.value = order
  detailModalOpen.value = true
}

const handleVerify = async (orderId, targetStatus) => {
  actionLoadingId.value = orderId
  try {
    const res = await verifikasiTransaksi(orderId, targetStatus)
    if (res.success) {
      const idx = allOrders.value.findIndex((o) => String(o.id) === String(orderId))
      if (idx !== -1) {
        allOrders.value[idx].status = targetStatus
      }

      if (targetStatus === 'terverifikasi') {
        alert(`Pesanan #${orderId} berhasil DIVERIFIKASI! Status kini Terverifikasi dan tidak lagi Pending.`)
      } else if (targetStatus === 'ditolak') {
        alert(`Pesanan #${orderId} telah ditolak.`)
      } else if (targetStatus === 'sedang_dikirim') {
        alert(`Pesanan #${orderId} sedang dikirim.`)
      } else if (targetStatus === 'sudah_di_tempat') {
        alert(`Pesanan #${orderId} sudah sampai di tempat.`)
      } else if (targetStatus === 'diterima') {
        alert(`Pesanan #${orderId} telah diterima pelanggan.`)
      }
    }
  } catch (err) {
    console.error('Gagal verifikasi transaksi:', err)
    alert('Gagal memverifikasi transaksi. Silakan coba lagi.')
  } finally {
    actionLoadingId.value = null
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    allOrders.value = await fetchOrders(true)
  } catch (err) {
    console.error('Gagal mengambil daftar transaksi admin:', err)
  } finally {
    loading.value = false
  }
}

const handleClearHistory = () => {
  if (historyOrders.value.length === 0) return

  const confirmed = window.confirm(
    `Hapus ${historyOrders.value.length} transaksi dari riwayat? Pesanan pending tidak akan dihapus.`
  )
  if (!confirmed) return

  removeOrderHistory(historyOrders.value.map((order) => order.id))
  allOrders.value = allOrders.value.filter((order) => (order.status || 'pending').toLowerCase() === 'pending')
  activeStatusFilter.value = 'semua'
}

const handleDeleteOrder = (order) => {
  if (!order?.id || order.status === 'pending') return

  const confirmed = window.confirm(`Hapus transaksi #${order.id} dari riwayat?`)
  if (!confirmed) return

  removeOrderHistory([order.id])
  allOrders.value = allOrders.value.filter((item) => String(item.id) !== String(order.id))
}

onMounted(() => {
  loadOrders()
  window.addEventListener('transaksi-updated', loadOrders)
})

onUnmounted(() => {
  window.removeEventListener('transaksi-updated', loadOrders)
})
</script>
