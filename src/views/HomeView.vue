<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import StokBadge from '../components/StokBadge.vue'

const router = useRouter()

const categories = ref(['Semua', 'Beras', 'Minyak', 'Gula / Garam', 'Bumbu'])
const selectedCategory = ref('Semua')
const products = ref([])
const loading = ref(true)
const errorMessage = ref('')
const cartCount = ref(0)

const fetchProducts = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/products')
    const rawData = response.data.data || response.data
    products.value = Array.isArray(rawData) ? rawData.filter(item => item !== null) : []
  } catch (error) {
    console.error('Gagal mengambil data produk:', error)
    errorMessage.value = 'Gagal memuat data dari server database.'
  } finally {
    loading.value = false
  }
}

const getCategoryName = (kategori) => {
  if (!kategori) return '-'
  if (typeof kategori === 'object') {
    return (kategori.nama_kategori || kategori.nama || '-').replaceAll('&', '/')
  }
  return String(kategori).replaceAll('&', '/')
}

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'Semua') {
    return products.value
  }

  const target = selectedCategory.value.toLowerCase()

  return products.value.filter(product => {
    if (!product) return false

    const catName = getCategoryName(product.kategori).toLowerCase()
    const productName = (product.nama_produk || product.nama || '').toLowerCase()
    const categoryId = String(product.kategori_id || product.kategori?.id || '')

    const matchesId =
      (target.includes('beras') && categoryId === '1') ||
      (target.includes('minyak') && categoryId === '3') ||
      (target.includes('gula') && categoryId === '4') ||
      (target.includes('bumbu') && categoryId === '5')

    return catName.includes(target) || matchesId || productName.includes(target.split(' ')[0])
  })
})

const goToDetail = (id) => {
  if (!id) return
  router.push(`/produk/${id}`)
}

const apiBaseUrl = (api.defaults.baseURL || 'http://10.10.8.174:8000/api').replace(/\/api\/?$/, '')

const getProductImageUrl = (product) => {
  const imageValue = product?.gambar || product?.foto || product?.image || product?.foto_url || product?.image_url || product?.photo || product?.cover || ''

  if (!imageValue || typeof imageValue !== 'string') {
    return 'https://placehold.co/300x300/d1fae5/065f46?text=Produk'
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

const getCartUniqueCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const uniqueIds = new Set(
      (Array.isArray(cart) ? cart : [])
        .map((item) => item?.product_id || item?.produk_id || item?.id)
        .filter(Boolean)
    )
    return uniqueIds.size
  } catch (error) {
    return 0
  }
}

const refreshCartCount = () => {
  cartCount.value = getCartUniqueCount()
}

const addToCart = (product, event) => {
  event.stopPropagation()
  if (!product) return

  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const existingItem = cart.find(item => item?.id === product.id)

  if (existingItem) {
    existingItem.qty++
  } else {
    cart.push({
      id: product.id,
      product_id: product.id,
      nama: product.nama_produk || product.nama,
      harga: product.harga,
      gambar: getProductImageUrl(product),
      qty: 1
    })
  }

  localStorage.setItem('cart', JSON.stringify(cart))
  refreshCartCount()
  alert(`${product.nama_produk || product.nama} berhasil ditambahkan ke keranjang!`)
}

const pesanSekarang = (product, event) => {
  if (event) event.stopPropagation()
  if (!product) return

  // Tambah ke keranjang
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const existingItem = cart.find(item => item?.id === product.id)

  if (existingItem) {
    existingItem.qty++
  } else {
    cart.push({
      id: product.id,
      product_id: product.id,
      nama: product.nama_produk || product.nama,
      harga: product.harga,
      gambar: getProductImageUrl(product),
      qty: 1
    })
  }

  localStorage.setItem('cart', JSON.stringify(cart))
  refreshCartCount()
  
  // Langsung ke checkout
  router.push('/checkout')
}

const categoryIcons = {
  'Semua': '🛒',
  'Beras': '🌾',
  'Minyak': '🫙',
  'Gula / Garam': '🧂',
  'Bumbu': '🌶️',
}

onMounted(() => {
  fetchProducts()
  refreshCartCount()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <section class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Toko Sembako Online
          </span>
          <h2 class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-tight">
            Belanja kebutuhan harian<br class="hidden sm:block" /> praktis, hemat & terpercaya 🛒
          </h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-500">
            Kebutuhan dapur harian langsung dari toko terdekat dengan produk lengkap, segar, dan harga terjangkau.
          </p>
        </div>
        <div class="shrink-0">
          <button
            @click="router.push('/keranjang')"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-sm"
          >
            🛒
            <span>Keranjang Belanja</span>
            <span v-if="cartCount > 0" class="rounded-full bg-white/20 text-white px-2 py-0.5 text-[10px] font-bold">
              {{ cartCount }}
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Kategori -->
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 class="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wider">🗂 Pilih Kategori</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2',
            selectedCategory === cat
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
          ]"
        >
          <span>{{ categoryIcons[cat] || '📦' }}</span>
          {{ cat }}
        </button>
      </div>
    </section>

    <!-- Daftar Produk -->
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-bold text-slate-800">Daftar Produk</h3>
          <p class="text-xs text-slate-400 mt-0.5">{{ filteredProducts.length }} produk ditemukan</p>
        </div>
        <button
          @click="router.push('/keranjang')"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
        >
          🛒 Keranjang: {{ cartCount }} jenis
        </button>
      </div>

      <div v-if="loading" class="py-16 text-center">
        <div class="inline-flex flex-col items-center gap-3">
          <div class="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
          <p class="text-sm text-slate-400 font-medium">Memuat produk...</p>
        </div>
      </div>

      <div v-else-if="errorMessage" class="py-12 rounded-2xl bg-red-50 border border-red-100 text-center">
        <div class="text-3xl mb-2">⚠️</div>
        <p class="text-sm text-red-600 font-medium">{{ errorMessage }}</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="py-16 text-center">
        <div class="text-4xl mb-3">📭</div>
        <p class="text-sm text-slate-500 font-medium">Tidak ada produk dalam kategori ini.</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <article
          v-for="product in filteredProducts"
          :key="product?.id || Math.random()"
          @click="product?.id && goToDetail(product.id)"
          class="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
        >
          <div class="relative mb-3 overflow-hidden rounded-xl bg-slate-50">
            <img
              :src="getProductImageUrl(product)"
              :alt="product?.nama_produk || product?.nama || 'Produk'"
              class="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <!-- Status Badge Component -->
            <div class="absolute left-2 top-2">
              <StokBadge :stok="product?.stok || 0" :stok-minimum="product?.stok_minimum || 10" size="sm" />
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              {{ getCategoryName(product?.kategori) }}
            </p>
            <h4 class="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
              {{ product?.nama_produk || product?.nama || 'Tanpa Nama' }}
            </h4>

            <div class="flex items-baseline gap-1">
              <span class="text-base font-bold text-slate-900">
                Rp {{ Number(product?.harga || 0).toLocaleString('id-ID') }}
              </span>
              <span class="text-[10px] text-slate-400">/ {{ product?.satuan || 'pcs' }}</span>
            </div>
          </div>

          <button
            v-if="(product?.stok || 0) === 0"
            disabled
            class="mt-4 w-full rounded-xl bg-slate-300 text-slate-600 px-3 py-2.5 text-xs font-semibold cursor-not-allowed"
          >
            Stok Habis
          </button>
          <div v-else class="mt-4 flex gap-2.5">
            <button
              @click="addToCart(product, $event)"
              class="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white transition-all duration-200 shadow-sm active:scale-95"
            >
              🛒 Keranjang
            </button>
            <button
              @click="pesanSekarang(product)"
              class="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition-all duration-200 shadow-sm active:scale-95"
            >
              ⚡ Pesan
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>