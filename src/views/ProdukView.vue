<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const products = ref([])
const loading = ref(false)
const isModalOpen = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null,
  nama_produk: '',
  kategori_id: '1',
  harga: '',
  stok: '',
  satuan: 'kg',
  deskripsi: '',
  gambar: ''
})

const previewImage = ref('')
const imageFile = ref(null)

const categoryOptions = [
  { id: '1', name: 'Beras / Tepung' },
  { id: '2', name: 'Minyak / Gula' },
  { id: '3', name: 'Minyak / Margarin' },
  { id: '4', name: 'Gula / Garam' },
  { id: '5', name: 'Bumbu Dapur' }
]

const onImageSelect = (event) => {
  const file = event.target.files?.[0]
  if (!file) {
    imageFile.value = null
    previewImage.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    alert('File yang dipilih harus berupa gambar.')
    event.target.value = ''
    imageFile.value = null
    previewImage.value = ''
    return
  }

  imageFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result || ''
  }
  reader.readAsDataURL(file)
}

const fetchProducts = async () => {
  loading.value = true

  try {
    const res = await api.get('/products')
    const rawData = res.data.data || res.data
    products.value = Array.isArray(rawData) ? rawData.filter(item => item !== null) : []
  } catch (err) {
    if (err.response?.status === 401) {
      alert('Sesi login berakhir. Silakan login kembali.')
      router.push('/login')
    } else {
      alert('Gagal mengambil data produk')
    }
  } finally {
    loading.value = false
  }
}

const openModal = (product = null) => {
  imageFile.value = null
  previewImage.value = ''

  if (product && typeof product === 'object') {
    isEdit.value = true
    form.value = {
      id: String(product.id).split(':')[0],
      nama_produk: product.nama_produk || product.nama || '',
      kategori_id: typeof product.kategori === 'object' && product.kategori !== null
        ? String(product.kategori.id || '1')
        : String(product.kategori_id || '1'),
      harga: product.harga || '',
      stok: product.stok || '',
      satuan: product.satuan || 'kg',
      deskripsi: product.deskripsi || '',
      gambar: product.gambar || product.foto || ''
    }
    previewImage.value = product.gambar || product.foto || ''
  } else {
    isEdit.value = false
    form.value = {
      id: null,
      nama_produk: '',
      kategori_id: '1',
      harga: '',
      stok: '',
      satuan: 'kg',
      deskripsi: '',
      gambar: ''
    }
  }

  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSubmit = async () => {
  try {
    const payload = {
      nama_produk: form.value.nama_produk,
      nama: form.value.nama_produk,
      kategori_id: form.value.kategori_id,
      harga: Number(form.value.harga),
      stok: Number(form.value.stok),
      satuan: form.value.satuan,
      deskripsi: form.value.deskripsi || '',
      gambar: form.value.gambar || '',
      foto: form.value.gambar || ''
    }

    if (imageFile.value instanceof File) {
      const formData = new FormData()
      formData.append('nama_produk', form.value.nama_produk)
      formData.append('nama', form.value.nama_produk)
      formData.append('kategori_id', String(form.value.kategori_id))
      formData.append('harga', String(Number(form.value.harga)))
      formData.append('stok', String(Number(form.value.stok)))
      formData.append('satuan', form.value.satuan)
      formData.append('deskripsi', form.value.deskripsi || '')
      formData.append('foto', imageFile.value)
      formData.append('gambar', imageFile.value)

      if (isEdit.value && form.value.id) {
        const cleanId = String(form.value.id).split(':')[0]
        await api.put(`/products/${cleanId}`, formData)
        alert('Produk berhasil diperbarui!')
      } else {
        await api.post('/products', formData)
        alert('Produk berhasil ditambahkan!')
      }
    } else {
      if (isEdit.value && form.value.id) {
        const cleanId = String(form.value.id).split(':')[0]
        await api.put(`/products/${cleanId}`, payload)
        alert('Produk berhasil diperbarui!')
      } else {
        await api.post('/products', payload)
        alert('Produk berhasil ditambahkan!')
      }
    }

    closeModal()
    fetchProducts()
  } catch (err) {
    console.error('Error submit:', err.response?.data || err.message)
    if (err.response?.status === 401) {
      alert('Sesi login telah habis. Silakan logout dan login kembali.')
      router.push('/login')
    } else if (err.response?.data?.message) {
      alert(`Error: ${err.response.data.message}`)
    } else {
      alert('Gagal menyimpan data produk. Cek kembali kelengkapan input.')
    }
  }
}

const deleteProduct = async (id) => {
  if (!id) return

  const cleanId = String(id).split(':')[0]
  if (confirm('Yakin ingin menghapus produk ini?')) {
    try {
      await api.delete(`/products/${cleanId}`)
      alert('Produk berhasil dihapus!')
      fetchProducts()
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesi login telah habis. Silakan login kembali.')
        router.push('/login')
      } else {
        alert('Gagal menghapus produk')
      }
    }
  }
}

const getCategoryName = (kategori) => {
  if (!kategori) return '-'
  if (typeof kategori === 'object') {
    return (kategori.nama_kategori || kategori.nama || '-').replaceAll('&', '/')
  }
  return String(kategori).replaceAll('&', '/')
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">🏢 Admin Panel</span>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-800">Manajemen Stok Produk</h2>
          <p class="text-sm text-slate-500 mt-0.5">Kelola katalog produk sembako toko Anda</p>
        </div>

        <button
          @click="openModal()"
          class="rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Produk
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
          <tr>
            <th class="p-4">Nama Produk</th>
            <th class="p-4">Kategori</th>
            <th class="p-4">Harga</th>
            <th class="p-4">Stok</th>
            <th class="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="p-12 text-center">
              <div class="inline-flex flex-col items-center gap-2">
                <div class="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
                <p class="text-sm text-slate-400">Memuat data...</p>
              </div>
            </td>
          </tr>
          <tr v-else-if="products.length === 0">
            <td colspan="5" class="p-12 text-center">
              <div class="text-3xl mb-2">📦</div>
              <p class="text-slate-500 font-medium">Belum ada data produk.</p>
            </td>
          </tr>
          <tr v-else v-for="p in products" :key="p?.id || Math.random()" class="border-t border-slate-100 hover:bg-emerald-50/30 transition-colors group">
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div v-if="p?.gambar || p?.foto" class="h-10 w-10 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <img :src="p?.gambar || p?.foto" :alt="p?.nama_produk" class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm shrink-0">⚓</div>
                <span class="font-semibold text-slate-800">{{ p?.nama_produk || p?.nama || '-' }}</span>
              </div>
            </td>
            <td class="p-4">
              <span class="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold">
                {{ getCategoryName(p?.kategori) }}
              </span>
            </td>
            <td class="p-4 font-bold text-slate-800">Rp {{ Number(p?.harga || 0).toLocaleString('id-ID') }}</td>
            <td class="p-4">
              <span :class="[
                'inline-flex rounded-xl px-2.5 py-1 text-xs font-bold border',
                Number(p?.stok || 0) < 10
                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              ]">
                {{ p?.stok || 0 }} {{ p?.satuan || 'pcs' }}
              </span>
            </td>
            <td class="p-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal(p)" class="rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1">
                  ✏️ Edit
                </button>
                <button @click="p?.id && deleteProduct(p.id)" class="rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1">
                  🗑️ Hapus
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 class="text-xl font-bold text-slate-900">{{ isEdit ? '✏️ Edit Produk' : '➕ Tambah Produk Baru' }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ isEdit ? 'Perbarui informasi produk' : 'Tambahkan produk baru ke katalog' }}</p>
          </div>
          <button @click="closeModal" class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nama Produk</label>
            <input
              v-model="form.nama_produk"
              placeholder="Nama Produk"
              required
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Kategori</label>
              <select v-model="form.kategori_id" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white">
                <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Satuan</label>
              <input
                v-model="form.satuan"
                placeholder="kg, pcs, ltr..."
                required
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Harga (Rp)</label>
              <input
                v-model.number="form.harga"
                type="number"
                placeholder="0"
                required
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Jumlah Stok</label>
              <input
                v-model.number="form.stok"
                type="number"
                placeholder="0"
                required
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Deskripsi Produk</label>
            <textarea
              v-model="form.deskripsi"
              rows="2"
              placeholder="Masukkan deskripsi produk"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white resize-none"
            ></textarea>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Gambar Produk</label>
            <div class="space-y-3">
              <div v-if="previewImage" class="relative h-32 w-full overflow-hidden rounded-2xl bg-emerald-50 border border-emerald-200">
                <img :src="previewImage" :alt="form.nama_produk" class="h-full w-full object-cover" />
              </div>
              <input
                type="file"
                accept="image/*"
                @change="onImageSelect"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 file:cursor-pointer file:border-0 file:bg-emerald-100 file:text-emerald-700 file:px-3 file:py-1 file:text-xs file:font-bold file:rounded-lg file:mr-3 hover:file:bg-emerald-200"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" @click="closeModal" class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" class="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white transition shadow-sm">
              {{ isEdit ? 'Simpan Perubahan' : 'Tambah Produk' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>