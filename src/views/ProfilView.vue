<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const user = ref({
  name: '',
  email: '',
  role: '',
  no_hp: '',
  alamat: ''
})

const form = ref({
  name: '',
  email: '',
  no_hp: '',
  alamat: ''
})

const isEditing = ref(false)
const saving = ref(false)

const isAdmin = computed(() => {
  const role = String(user.value.role || '').toLowerCase()
  return role === 'admin' || role === 'administrator' || role.includes('admin')
})

const profileTitle = computed(() => (isAdmin.value ? 'Profil Admin' : 'Profil Saya'))

const loadUser = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  user.value = currentUser
  form.value = {
    name: currentUser.name || '',
    email: currentUser.email || '',
    no_hp: currentUser.no_hp || currentUser.phone || '',
    alamat: currentUser.alamat || currentUser.address || ''
  }
}

const saveProfile = async () => {
  saving.value = true

  try {
    const payload = {
      name: form.value.name,
      email: form.value.email,
      no_hp: form.value.no_hp,
      alamat: form.value.alamat
    }

    const profileEndpoints = isAdmin.value
      ? ['/admin/profil', '/profil', '/pelanggan/profil']
      : ['/pelanggan/profil', '/profil']

    const tryUpdate = async () => {
      let lastError
      for (const endpoint of profileEndpoints) {
        for (const method of ['patch', 'put', 'post']) {
          try {
            return await api[method](endpoint, payload)
          } catch (err) {
            lastError = err
            if (![404, 405].includes(err.response?.status)) throw err
          }
        }
      }
      throw lastError
    }

    try {
      const response = await tryUpdate()
      const updatedUser = response.data?.user || response.data?.data || { ...user.value, ...payload }
      user.value = { ...user.value, ...updatedUser }
    } catch (error) {
      console.warn('Profile update failed on server, using local fallback only.', error)

      if (error.response?.status === 405 || error.response?.status === 404) {
        alert('Backend belum punya endpoint update profil. Tambahkan route PUT/PATCH /pelanggan/profil di Laravel agar data tersimpan ke server.')
      }

      user.value = { ...user.value, ...payload }
    }

    localStorage.setItem('user', JSON.stringify(user.value))
    window.dispatchEvent(new CustomEvent('user-updated'))
    isEditing.value = false
  } catch (error) {
    console.error('Gagal menyimpan profil:', error)
    alert('Gagal menyimpan profil. Silakan coba lagi.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUser()
})
</script>

<template>
  <div class="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-sm">
            {{ (user.name || (isAdmin ? 'A' : 'U')).charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-800">{{ profileTitle }}</h2>
            <p class="text-xs text-slate-500">Kelola informasi akun dan kontak Anda</p>
          </div>
        </div>
      <button
        v-if="!isEditing"
        type="button"
        @click="isEditing = true"
        class="rounded-lg bg-slate-500 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
      >
        Edit Profil
      </button>
    </div>

    <div v-if="!isEditing" class="space-y-4 text-sm">
      <div class="grid grid-cols-3 border-b border-slate-100 py-2">
        <span class="font-medium text-slate-500">Nama</span>
        <span class="col-span-2 font-bold text-slate-800">{{ user.name || '-' }}</span>
      </div>
      <div class="grid grid-cols-3 border-b border-slate-100 py-2">
        <span class="font-medium text-slate-500">Email</span>
        <span class="col-span-2 text-slate-800">{{ user.email || '-' }}</span>
      </div>
      <div class="grid grid-cols-3 border-b border-slate-100 py-2">
        <span class="font-medium text-slate-500">Role</span>
        <span class="col-span-2 capitalize font-semibold text-slate-700">{{ user.role || 'pembeli' }}</span>
      </div>
      <div class="grid grid-cols-3 border-b border-slate-100 py-2">
        <span class="font-medium text-slate-500">No. Telepon</span>
        <span class="col-span-2 text-slate-800">{{ user.no_hp || '-' }}</span>
      </div>
      <div class="grid grid-cols-3 border-b border-slate-100 py-2">
        <span class="font-medium text-slate-500">Alamat</span>
        <span class="col-span-2 text-slate-800">{{ user.alamat || '-' }}</span>
      </div>
    </div>

    <form v-else @submit.prevent="saveProfile" class="space-y-4">
      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Nama</label>
        <input v-model="form.name" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white" />
      </div>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Email</label>
        <input v-model="form.email" type="email" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white" />
      </div>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">No. Telepon</label>
        <input v-model="form.no_hp" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white" />
      </div>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Alamat</label>
        <textarea v-model="form.alamat" rows="4" class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white"></textarea>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="isEditing = false" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Batal
        </button>
        <button type="submit" :disabled="saving" class="rounded-xl bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60">
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>
  </div>
</template>