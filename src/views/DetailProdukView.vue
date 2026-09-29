<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const quantity = ref(1)

// Mengambil ID dari parameter URL (misal: /produk/:id)
const productId = route.params.id

const fetchProductDetail = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get(`/products/${productId}`)
    product.value = res.data.data || res.data
  } catch (err) {
    console.error('Gagal mengambil detail produk:', err)
    errorMessage.value = 'Produk tidak ditemukan atau terjadi kesalahan server.'
  } finally {
    loading.value = false
  }
}

const apiBaseUrl = (api.defaults.baseURL || 'http://10.10.8.174:8000/api').replace(/\/api\/?$/, '')

const getCategoryName = (kategori) => {
  if (!kategori) return '-'
  if (typeof kategori === 'object') {
    return (kategori.nama_kategori || kategori.nama || '-').replaceAll('&', '/')
  }
  return String(kategori).replaceAll('&', '/')
}

const getProductImageUrl = (productItem) => {
  const imageValue = productItem?.gambar || productItem?.foto || productItem?.image || productItem?.foto_url || productItem?.image_url || productItem?.photo || productItem?.cover || ''

  if (!imageValue || typeof imageValue !== 'string') {
    return 'https://placehold.co/500x500?text=SembakoMart'
  }

  const normalized = imageValue.trim()

  if (normalized.startsWith('data:image')) return normalized
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
  if (normalized.startsWith('/')) return `${apiBaseUrl}${normalized}`

  if (normalized.includes('/') || normalized.includes('\\')) {
    return `${apiBaseUrl}/${normalized.replace(/^\/+/, '')}`
  }

  return `${apiBaseUrl}/storage/${normalized.replace(/^\/+/, '')}`
}

const addToCart = () => {
  if (!product.value) return

  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const existingItem = cart.find(item => item.id === product.value.id)

  if (existingItem) {
    existingItem.qty += quantity.value
  } else {
    cart.push({
      id: product.value.id,
      nama: product.value.nama_produk || product.value.nama,
      harga: product.value.harga,
      gambar: getProductImageUrl(product.value),
      qty: quantity.value
    })
  }

  localStorage.setItem('cart', JSON.stringify(cart))
  alert(`Berhasil menambahkan ${quantity.value} item ke keranjang!`)
}

onMounted(() => {
  if (productId) {
    fetchProductDetail()
  } else {
    errorMessage.value = 'ID Produk tidak valid.'
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Tombol Kembali -->
    <button 
      @click="router.back()" 
      class="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
    >
      ← Kembali ke Beranda
    </button>

    <!-- State Loading -->
    <div v-if="loading" class="bg-white p-8 rounded-2xl shadow border border-slate-300 flex justify-center items-center min-h-[300px]">
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-slate-500">Memuat detail produk...</p>
      </div>
    </div>

    <!-- State Error -->
    <div v-else-if="errorMessage" class="bg-white p-8 rounded-2xl shadow border border-slate-300 text-center text-red-600">
      <p class="font-semibold">{{ errorMessage }}</p>
      <button 
        @click="router.push('/')" 
        class="mt-4 px-4 py-2 bg-slate-500 text-white rounded-lg text-xs font-semibold hover:bg-slate-600"
      >
        Lihat Produk Lainnya
      </button>
    </div>

    <!-- Konten Detail Produk -->
    <div v-else-if="product" class="bg-white rounded-2xl shadow-sm border border-slate-300 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Gambar Produk -->
      <div class="aspect-square w-full rounded-xl bg-slate-50 overflow-hidden border border-slate-300">
        <img 
          :src="getProductImageUrl(product)" 
          :alt="product.nama_produk || product.nama"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Informasi Produk -->
      <div class="flex flex-col justify-between">
        <div class="space-y-4">
          <span class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
            {{ getCategoryName(product.kategori) }}
          </span>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {{ product.nama_produk || product.nama }}
          </h1>

          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-emerald-700">
              Rp {{ Number(product.harga || 0).toLocaleString('id-ID') }}
            </span>
            <span class="text-sm text-slate-400">/ {{ product.satuan || 'pcs' }}</span>
          </div>

          <hr class="border-slate-200" />

          <div>
            <h3 class="text-sm font-bold text-slate-700 mb-1">Deskripsi Produk</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              {{ product.deskripsi || 'Sembako berkualitas tinggi untuk memenuhi kebutuhan dapur sehari-hari keluarga Anda.' }}
            </p>
          </div>

          <div class="flex items-center gap-4 text-sm text-slate-600">
            <span class="font-semibold">Stok Tersedia:</span>
            <span :class="product.stok > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">
              {{ product.stok }} {{ product.satuan || 'pcs' }}
            </span>
          </div>
        </div>

        <!-- Alur Pembelian & Qty -->
        <div class="mt-8 pt-4 border-t border-slate-200 space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-slate-600">Jumlah:</span>
            <div class="flex items-center border border-slate-300 rounded-lg">
              <button 
                @click="quantity > 1 && quantity--" 
                class="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-l-lg"
              >
                -
              </button>
              <span class="px-4 text-sm font-semibold">{{ quantity }}</span>
              <button 
                @click="quantity < product.stok && quantity++" 
                class="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>

          <button 
            @click="addToCart"
            :disabled="product.stok <= 0"
            class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm active:scale-95"
          >
            {{ product.stok > 0 ? '+ Tambah ke Keranjang' : 'Stok Habis' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>