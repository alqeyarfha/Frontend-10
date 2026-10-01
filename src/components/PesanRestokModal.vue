<script setup>
import { ref } from 'vue'
import { createRestokOrder } from '../services/restokService'

const props = defineProps({
  produk: Object,
  isOpen: Boolean
})

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const jumlahPesan = ref(10)
const tanggalDiharapkan = ref('')
const catatan = ref('')
const successMessage = ref('')
const errorMessage = ref('')

// Set tanggal default (7 hari dari sekarang)
const setDefaultTanggal = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  tanggalDiharapkan.value = `${year}-${month}-${day}`
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!jumlahPesan.value || jumlahPesan.value < 1) {
    errorMessage.value = 'Jumlah pesanan harus lebih dari 0'
    return
  }

  loading.value = true
  try {
    // Submit ke backend via service
    const payload = {
      produk_id: props.produk.id,
      nama_produk: props.produk.nama,
      jumlah_pesan: parseInt(jumlahPesan.value),
      stok_saat_ini: parseInt(props.produk.stok || 0),
      stok_minimum: parseInt(props.produk.stok_minimum || 10),
      tanggal_diharapkan: tanggalDiharapkan.value,
      catatan: catatan.value || '',
      status: 'pending'
    }

    await createRestokOrder(payload)

    successMessage.value = `✅ Pesanan restok untuk "${props.produk.nama}" berhasil dibuat!`
    
    setTimeout(() => {
      emit('success')
      resetForm()
      emit('close')
    }, 1500)
  } catch (error) {
    console.error('Error submit restok:', error)
    errorMessage.value = 'Gagal membuat pesanan. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  jumlahPesan.value = 10
  tanggalDiharapkan.value = ''
  catatan.value = ''
  successMessage.value = ''
  errorMessage.value = ''
  setDefaultTanggal()
}

const handleClose = () => {
  resetForm()
  emit('close')
}

// Initialize form when component mounted
if (props.isOpen && !tanggalDiharapkan.value) {
  setDefaultTanggal()
}
</script>

<template>
  <!-- Modal Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="handleClose"
  >
    <!-- Modal Card -->
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📝</span>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Pesan Restok</h2>
              <p class="text-sm text-slate-600">{{ produk?.nama }}</p>
            </div>
          </div>
          <button
            @click="handleClose"
            class="text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Info Stok Saat Ini -->
        <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-slate-500 font-medium">Stok Saat Ini</p>
              <p class="text-2xl font-bold text-slate-900">{{ produk?.stok || 0 }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-medium">Stok Minimum</p>
              <p class="text-2xl font-bold text-slate-900">{{ produk?.stok_minimum || 10 }}</p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <!-- Jumlah Pesan -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Jumlah Pesan <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="jumlahPesan = Math.max(1, jumlahPesan - 1)"
                class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                −
              </button>
              <input
                v-model.number="jumlahPesan"
                type="number"
                class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="1"
              />
              <button
                @click="jumlahPesan = jumlahPesan + 1"
                class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                +
              </button>
            </div>
            <p class="text-xs text-slate-500 mt-1">Rekomendasi: minimal {{ Math.max(10, (produk?.stok_minimum || 10) * 2) }} unit</p>
          </div>

          <!-- Tanggal Diharapkan -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Tanggal Pengiriman Diharapkan <span class="text-red-500">*</span>
            </label>
            <input
              v-model="tanggalDiharapkan"
              type="date"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p class="text-xs text-slate-500 mt-1">Default: 7 hari dari sekarang</p>
          </div>

          <!-- Catatan -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              v-model="catatan"
              placeholder="Contoh: Butuh pengiriman pagi hari, kualitas terbaik..."
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows="3"
            />
          </div>
        </div>

        <!-- Messages -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm text-red-700">⚠️ {{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p class="text-sm text-emerald-700">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
        <button
          @click="handleClose"
          class="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
          :disabled="loading"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading || !jumlahPesan || !tanggalDiharapkan"
          class="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold transition"
        >
          {{ loading ? '⏳ Memproses...' : '✓ Buat Pesanan' }}
        </button>
      </div>
    </div>
  </div>
</template>
