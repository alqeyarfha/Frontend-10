import api from './api'

const STORAGE_KEY_ORDERS = 'sembako_local_orders'
const STORAGE_KEY_UPDATES = 'sembako_transaksi_updates'
const STORAGE_KEY_REMOVED_ORDERS = 'sembako_removed_order_ids'
const REMOVED_ORDER_IDS = new Set(['101', '102', '103', '104'])

const getRemovedOrderIds = () => {
  try {
    const storedIds = JSON.parse(localStorage.getItem(STORAGE_KEY_REMOVED_ORDERS) || '[]')
    return new Set([
      ...REMOVED_ORDER_IDS,
      ...(Array.isArray(storedIds) ? storedIds.map((id) => String(id)) : [])
    ])
  } catch (e) {
    return new Set(REMOVED_ORDER_IDS)
  }
}

const isRemovedOrder = (order) => getRemovedOrderIds().has(String(order?.id))

export const normalizeOrderStatus = (status) => {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'diproses' || normalized === 'sedang dikirim') return 'sedang_dikirim'
  if (normalized === 'sudah di tempat' || normalized === 'sudah_ditempat') return 'sudah_di_tempat'
  if (normalized === 'selesai') return 'diterima'
  return normalized
}

const normalizePaymentMethod = (order) => {
  const rawMethod = order?.metode_pembayaran || order?.metode_bayar || order?.payment_method || order?.paymentMethod || order?.method
  const method = String(rawMethod || 'transfer').trim().toLowerCase()
  return method.includes('cod') || method.includes('cash') ? 'cod' : 'transfer'
}

const stripCustomerIdentifiers = (order) => {
  if (!order || typeof order !== 'object') return order

  const {
    user_id,
    pelanggan_id,
    customer_id,
    id_pelanggan,
    ...safeOrder
  } = order

  if (safeOrder.user && typeof safeOrder.user === 'object') {
    const { id, user_id: nestedUserId, pelanggan_id: nestedPelangganId, ...safeUser } = safeOrder.user
    safeOrder.user = safeUser
  }

  if (safeOrder.pelanggan && typeof safeOrder.pelanggan === 'object') {
    const { id, user_id: nestedUserId, pelanggan_id: nestedPelangganId, ...safeCustomer } = safeOrder.pelanggan
    safeOrder.pelanggan = safeCustomer
  }

  return safeOrder
}

// Mengambil pembaruan lokal (status & bukti yang diperbarui secara lokal)
export const getStoredUpdates = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_UPDATES) || '{}')
  } catch (e) {
    return {}
  }
}

// Menyimpan pembaruan lokal
export const saveStoredUpdates = (updates) => {
  try {
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updates))
    window.dispatchEvent(new CustomEvent('transaksi-updated'))
  } catch (e) {
    console.warn('Gagal menyimpan update transaksi ke localStorage', e)
  }
}

// Data pesanan contoh awal realistis agar dashboard tidak kosong saat sistem baru dibuka
const SAMPLE_ORDERS = [
  {
    id: 101,
    user_id: 1,
    nama_penerima: 'Budi Santoso',
    no_hp: '081234567890',
    alamat: 'Jl. Merdeka No. 45, RT 02/RW 05, Kel. Sukamaju',
    total_harga: 105000,
    total: 105000,
    tanggal: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending',
    metode_pembayaran: 'transfer',
    catatan: 'Tolong kirim sebelum jam 3 sore',
    bukti_transaksi: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520"><rect width="400" height="520" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="480" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><circle cx="200" cy="75" r="28" fill="%2310b981"/><path d="M190 75l7 7 14-14" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round"/><text x="200" y="130" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">TRANSFER BERHASIL</text><text x="200" y="150" font-size="12" fill="%2364748b" text-anchor="middle">Bank Mandiri Virtual Account</text><line x1="40" y1="170" x2="360" y2="170" stroke="%23e2e8f0" stroke-dasharray="4 4"/><text x="50" y="200" font-size="12" fill="%2364748b">Penerima</text><text x="350" y="200" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">SembakoMart Official</text><text x="50" y="230" font-size="12" fill="%2364748b">Nomor Pesanan</text><text x="350" y="230" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">%23101</text><text x="50" y="260" font-size="12" fill="%2364748b">Waktu</text><text x="350" y="260" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">Hari Ini</text><line x1="40" y1="285" x2="360" y2="285" stroke="%23e2e8f0"/><text x="50" y="320" font-size="13" fill="%2364748b">Total Nominal</text><text x="350" y="320" font-size="18" font-weight="bold" fill="%2310b981" text-anchor="end">Rp 105.000</text><rect x="40" y="350" width="320" height="90" rx="10" fill="%23f1f5f9"/><text x="60" y="375" font-size="11" fill="%23475569" font-weight="bold">Item Belanja:</text><text x="60" y="398" font-size="11" fill="%2364748b">- Beras Premium 5kg (x1)</text><text x="60" y="418" font-size="11" fill="%2364748b">- Minyak Goreng 2L (x1)</text><text x="200" y="475" font-size="11" fill="%2394a3b8" text-anchor="middle">Bukti transfer sah terverifikasi digital</text></svg>',
    items: [
      { id: 1, nama_produk: 'Beras Premium Ramos 5kg', qty: 1, harga: 68000, subtotal: 68000 },
      { id: 2, nama_produk: 'Minyak Goreng Sania 2L', qty: 1, harga: 37000, subtotal: 37000 }
    ]
  },
  {
    id: 102,
    user_id: 2,
    nama_penerima: 'Siti Rahmawati',
    no_hp: '085711223344',
    alamat: 'Komplek Griya Indah Blok C No. 8',
    total_harga: 58000,
    total: 58000,
    tanggal: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
    status: 'terverifikasi',
    metode_pembayaran: 'transfer',
    catatan: 'Taruh di pagar jika tidak ada orang',
    items: [
      { id: 3, nama_produk: 'Gula Pasir Gulaku 1kg', qty: 2, harga: 17500, subtotal: 35000 },
      { id: 4, nama_produk: 'Tepung Terigu Segitiga Biru 1kg', qty: 2, harga: 11500, subtotal: 23000 }
    ]
  },
  {
    id: 103,
    user_id: 3,
    nama_penerima: 'Ahmad Fauzi',
    no_hp: '081399887766',
    alamat: 'Jl. Kenanga No. 19, Sukamaju',
    total_harga: 142000,
    total: 142000,
    tanggal: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'selesai',
    metode_pembayaran: 'transfer',
    catatan: '',
    items: [
      { id: 5, nama_produk: 'Telur Ayam Negeri 1kg', qty: 2, harga: 28000, subtotal: 56000 },
      { id: 6, nama_produk: 'Mie Goreng Instan (1 Dus)', qty: 1, harga: 86000, subtotal: 86000 }
    ]
  },
  {
    id: 104,
    user_id: 4,
    nama_penerima: 'Hendra Wijaya',
    no_hp: '082155443322',
    alamat: 'Jl. Ahmad Yani No. 88',
    total_harga: 85000,
    total: 85000,
    tanggal: new Date(Date.now() - 90000000).toISOString(),
    created_at: new Date(Date.now() - 90000000).toISOString(),
    status: 'selesai',
    metode_pembayaran: 'cod',
    catatan: 'Bayar tunai di tempat',
    items: [
      { id: 2, nama_produk: 'Minyak Goreng Sania 2L', qty: 2, harga: 37000, subtotal: 74000 },
      { id: 7, nama_produk: 'Garam Beryodium 250g', qty: 2, harga: 5500, subtotal: 11000 }
    ]
  }
]

// Mengambil pesanan yang tersimpan lokal (untuk fallback offline dan demo)
export const getLocalOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS)
    if (!raw) {
      // Inisialisasi data transaksi awal agar dashboard terisi data
      const safeSampleOrders = SAMPLE_ORDERS
        .filter((order) => !isRemovedOrder(order))
        .map(stripCustomerIdentifiers)
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(safeSampleOrders))
      return safeSampleOrders
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const safeSampleOrders = SAMPLE_ORDERS
        .filter((order) => !isRemovedOrder(order))
        .map(stripCustomerIdentifiers)
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(safeSampleOrders))
      return safeSampleOrders
    }
    const activeOrders = parsed
      .filter((order) => !isRemovedOrder(order))
      .map(stripCustomerIdentifiers)
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(activeOrders))
    return activeOrders
  } catch (e) {
    return SAMPLE_ORDERS
      .filter((order) => !isRemovedOrder(order))
      .map(stripCustomerIdentifiers)
  }
}

// Menyimpan pesanan lokal
export const saveLocalOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders.map(stripCustomerIdentifiers)))
    window.dispatchEvent(new CustomEvent('transaksi-updated'))
  } catch (e) {
    console.warn('Gagal menyimpan pesanan lokal', e)
  }
}

export const removeOrderHistory = (orderIds) => {
  const idsToRemove = new Set((Array.isArray(orderIds) ? orderIds : []).map((id) => String(id)))
  if (idsToRemove.size === 0) return

  try {
    const removedIds = new Set(getRemovedOrderIds())
    idsToRemove.forEach((id) => removedIds.add(id))
    localStorage.setItem(STORAGE_KEY_REMOVED_ORDERS, JSON.stringify([...removedIds]))

    const localOrders = getLocalOrders().filter((order) => !idsToRemove.has(String(order?.id)))
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(localOrders))

    const updates = getStoredUpdates()
    idsToRemove.forEach((id) => delete updates[id])
    saveStoredUpdates(updates)
  } catch (e) {
    console.warn('Gagal menghapus riwayat transaksi lokal', e)
  }
}

// Normalisasi data pesanan dari berbagai variasi response API
export const normalizeOrders = (raw) => {
  if (!raw) return []

  let list = []
  if (Array.isArray(raw)) {
    list = raw
  } else if (Array.isArray(raw.data)) {
    list = raw.data
  } else if (Array.isArray(raw.pesanan)) {
    list = raw.pesanan
  } else if (Array.isArray(raw.transaksi)) {
    list = raw.transaksi
  } else if (Array.isArray(raw.orders)) {
    list = raw.orders
  } else if (Array.isArray(raw.latest_orders)) {
    list = raw.latest_orders
  } else if (raw.data && Array.isArray(raw.data.pesanan)) {
    list = raw.data.pesanan
  } else if (raw.data && Array.isArray(raw.data.transaksi)) {
    list = raw.data.transaksi
  } else if (raw.data && Array.isArray(raw.data.orders)) {
    list = raw.data.orders
  } else if (raw.data && Array.isArray(raw.data.latest_orders)) {
    list = raw.data.latest_orders
  } else if (raw.data && Array.isArray(raw.data.data)) {
    list = raw.data.data
  } else if (Array.isArray(raw.result)) {
    list = raw.result
  } else if (Array.isArray(raw.items)) {
    list = raw.items
  } else if (raw.data && typeof raw.data === 'object' && (raw.data.id || raw.data.total_harga || raw.data.total)) {
    list = [raw.data]
  } else if (typeof raw === 'object' && (raw.id || raw.total_harga || raw.total)) {
    list = [raw]
  }

  const updates = getStoredUpdates()

  return list
    .map((order) => {
      if (!order) return null
      const orderId = String(order.id || '')
      const localUpdate = updates[orderId] || {}

      const total = Number(order.total_harga ?? order.total ?? order.total_bayar ?? order.total_price ?? 0)
      const rawDate = order.tanggal || order.created_at || order.created || new Date().toISOString()
      const customerName = order.nama_penerima || order.pelanggan?.nama || order.user?.name || 'Pelanggan'
      const phone = order.no_hp || order.pelanggan?.no_hp || order.user?.no_hp || '-'
      const address = order.alamat || order.pelanggan?.alamat || order.user?.alamat || '-'

      const rawItems = order.produk || order.items || order.order_items || order.transaksi_items || []
      const items = Array.isArray(rawItems)
        ? rawItems.map((p) => ({
          id: p.id || p.id_barang || p.produk_id,
          nama_produk: p.nama_barang || p.nama_produk || p.nama || 'Produk Sembako',
          qty: Number(p.pivot?.jumlah || p.jumlah || p.qty || 1),
          harga: Number(p.pivot?.harga_satuan || p.harga_barang || p.harga || 0),
          subtotal: Number(
            p.pivot?.subtotal ||
            (p.pivot?.harga_satuan || p.harga_barang || p.harga || 0) * (p.pivot?.jumlah || p.jumlah || p.qty || 1)
          )
        }))
        : []

      return {
        ...stripCustomerIdentifiers(order),
        ...localUpdate,
        id: order.id || `TRX-${Date.now()}`,
        total_harga: total,
        total: total,
        tanggal: rawDate,
        created_at: order.created_at || rawDate,
        status: normalizeOrderStatus(localUpdate.status || order.status || 'pending'),
        nama_penerima: customerName,
        no_hp: phone,
        alamat: address,
        catatan: order.catatan || '',
        items: items.length > 0 ? items : (order.items || []),
        metode_pembayaran: normalizePaymentMethod(order),
        bukti_transaksi:
          localUpdate.bukti_transaksi ||
          order.bukti_transaksi ||
          order.bukti_pembayaran ||
          order.bukti ||
          order.foto_bukti ||
          null
      }
    })
    .filter(Boolean)
}

// URL normalisasi bukti transaksi (mendukung base64, URL eksternal, atau storage Laravel)
export const getProofImageUrl = (proof) => {
  if (!proof) return null
  const str = String(proof).trim()
  if (!str) return null

  if (str.startsWith('data:image') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('blob:')) {
    return str
  }

  const apiBaseUrl = (api.defaults.baseURL || 'http://10.10.9.59:8000/api').replace(/\/api\/?$/, '')
  if (str.startsWith('/')) {
    return `${apiBaseUrl}${str}`
  }
  if (str.includes('/') || str.includes('\\')) {
    return `${apiBaseUrl}/${str.replace(/^\/+/, '')}`
  }
  return `${apiBaseUrl}/storage/${str.replace(/^\/+/, '')}`
}

/**
 * Mengambil daftar transaksi
 * @param {boolean} isAdmin - jika true, ambil semua transaksi; jika false, ambil transaksi user saat ini
 */
export const fetchOrders = async (isAdmin = false) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  let remoteOrders = []

  // Prioritas endpoint remote API
  const endpoints = isAdmin
    ? ['/transaksi', '/transaksi?status=semua', '/pesanan', '/dashboard']
    : ['/riwayat', '/transaksi', '/pesanan']

  for (const ep of endpoints) {
    try {
      const res = await api.get(ep)
      if (res && res.data) {
        const parsed = normalizeOrders(res.data)
        if (parsed.length > 0) {
          remoteOrders = parsed
          break
        }
      }
    } catch (err) {
      // Coba endpoint selanjutnya
    }
  }

  // Gabungkan dengan pesanan lokal agar order dan status terbaru tidak hilang
  const localOrders = getLocalOrders()
  const updates = getStoredUpdates()

  // Map untuk deduplikasi berdasarkan order.id
  const orderMap = new Map()

  // Masukkan pesanan lokal terlebih dahulu
  localOrders.forEach((item) => {
    if (!item) return
    const id = String(item.id || '')
    const localUpdate = updates[id] || {}
    orderMap.set(id, {
      ...item,
      ...localUpdate,
      status: normalizeOrderStatus(localUpdate.status || item.status || 'pending'),
      bukti_transaksi: localUpdate.bukti_transaksi || item.bukti_transaksi || null
    })
  })

  // Masukkan pesanan dari remote API (menimpa atau menambahkan)
  remoteOrders.filter((item) => !isRemovedOrder(item)).forEach((item) => {
    if (!item) return
    const id = String(item.id || '')
    const localUpdate = updates[id] || {}
    orderMap.set(id, {
      ...item,
      ...localUpdate,
      status: normalizeOrderStatus(localUpdate.status || item.status || 'pending'),
      bukti_transaksi: localUpdate.bukti_transaksi || item.bukti_transaksi || null
    })
  })

  let allOrders = Array.from(orderMap.values())

  // Jika bukan admin, filter berdasarkan user id jika tersedia
  if (!isAdmin && currentUser.id) {
    const userFiltered = allOrders.filter((o) => {
      const orderUserId = o.user_id || o.pelanggan_id || o.user?.id
      return !orderUserId || String(orderUserId) === String(currentUser.id)
    })
    if (userFiltered.length > 0) {
      allOrders = userFiltered
    }
  }

  // Urutkan dari yang terbaru
  allOrders.sort((a, b) => {
    const dateA = new Date(a.created_at || a.tanggal || 0).getTime()
    const dateB = new Date(b.created_at || b.tanggal || 0).getTime()
    return (dateB || (b.id || 0)) - (dateA || (a.id || 0))
  })

  return allOrders
}

/**
 * Membuat transaksi baru beserta bukti pembayaran (jika ada)
 */
export const createOrder = async (payload, proofBase64 = null) => {
  let createdOrder = null

  const orderPayload = {
    ...payload,
    metode_pembayaran: normalizePaymentMethod(payload),
    metode_bayar: normalizePaymentMethod(payload),
    payment_method: normalizePaymentMethod(payload),
    status: 'pending',
    bukti_transaksi: proofBase64 || null,
    bukti_pembayaran: proofBase64 || null
  }

  try {
    let response
    try {
      response = await api.post('/transaksi', orderPayload)
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 405) {
        response = await api.post('/keranjang/checkout', orderPayload)
      } else {
        throw error
      }
    }

    createdOrder = response.data?.transaksi || response.data?.order || response.data?.data || response.data
  } catch (error) {
    console.warn('Gagal menyimpan transaksi ke backend API, fallback ke penyimpanan lokal:', error)
  }

  // Siapkan objek pesanan
  const orderId = createdOrder?.id || `TRX-${Date.now()}`
  const finalOrder = {
    ...(createdOrder || {}),
    ...orderPayload,
    id: orderId,
    created_at: createdOrder?.created_at || new Date().toISOString(),
    status: 'pending',
    bukti_transaksi: proofBase64 || createdOrder?.bukti_transaksi || null
  }

  // Simpan ke local orders untuk fallback offline
  const localOrders = getLocalOrders()
  localOrders.unshift(finalOrder)
  saveLocalOrders(localOrders)

  // Simpan metode dan bukti ke updates agar tidak tertimpa saat data backend dimuat ulang.
  const updates = getStoredUpdates()
  updates[String(orderId)] = {
    ...(updates[String(orderId)] || {}),
    metode_pembayaran: orderPayload.metode_pembayaran,
    status: 'pending',
    ...(proofBase64 ? { bukti_transaksi: proofBase64 } : {})
  }
  saveStoredUpdates(updates)

  return finalOrder
}

/**
 * Mengunggah atau memperbarui bukti transaksi pada pesanan
 */
export const uploadBuktiTransaksi = async (orderId, proofBase64, fileObj = null) => {
  const cleanId = String(orderId)

  // 1. Simpan ke local updates agar perubahan langsung aktif seketika
  const updates = getStoredUpdates()
  updates[cleanId] = {
    ...(updates[cleanId] || {}),
    bukti_transaksi: proofBase64
  }
  saveStoredUpdates(updates)

  // Perbarui juga di local orders jika ada
  const localOrders = getLocalOrders()
  const idx = localOrders.findIndex((o) => String(o.id) === cleanId)
  if (idx !== -1) {
    localOrders[idx].bukti_transaksi = proofBase64
    saveLocalOrders(localOrders)
  }

  // 2. Coba kirim ke backend API
  try {
    if (fileObj instanceof File) {
      const formData = new FormData()
      formData.append('bukti_transaksi', fileObj)
      formData.append('bukti_pembayaran', fileObj)
      formData.append('foto_bukti', fileObj)

      try {
        await api.post(`/transaksi/${cleanId}/bukti`, formData)
        return { success: true }
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
          await api.post(`/transaksi/${cleanId}/upload-bukti`, formData)
          return { success: true }
        }
      }
    } else {
      const jsonPayload = {
        bukti_transaksi: proofBase64,
        bukti_pembayaran: proofBase64
      }
      try {
        await api.put(`/transaksi/${cleanId}`, jsonPayload)
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 405) {
          await api.patch(`/transaksi/${cleanId}`, jsonPayload)
        }
      }
    }
  } catch (error) {
    console.warn('Backend endpoint upload bukti belum tersedia, bukti tersimpan di cache lokal.', error.message)
  }

  return { success: true }
}

/**
 * Verifikasi transaksi oleh Admin (mengubah status dari pending menjadi terverifikasi / selesai / ditolak)
 */
export const verifikasiTransaksi = async (orderId, newStatus = 'terverifikasi', catatan = '') => {
  const cleanId = String(orderId)

  // 1. Simpan ke local updates segera
  const updates = getStoredUpdates()
  updates[cleanId] = {
    ...(updates[cleanId] || {}),
    status: newStatus.toLowerCase(),
    catatan_admin: catatan || updates[cleanId]?.catatan_admin || ''
  }
  saveStoredUpdates(updates)

  // Perbarui juga di local orders
  const localOrders = getLocalOrders()
  const idx = localOrders.findIndex((o) => String(o.id) === cleanId)
  if (idx !== -1) {
    localOrders[idx].status = newStatus.toLowerCase()
    saveLocalOrders(localOrders)
  }

  // 2. Kirim update status ke server backend
  try {
    const payload = {
      status: newStatus.toLowerCase(),
      catatan_admin: catatan
    }

    try {
      await api.patch(`/transaksi/${cleanId}/verifikasi`, payload)
    } catch (e1) {
      if (e1.response?.status === 404 || e1.response?.status === 405) {
        try {
          await api.post(`/transaksi/${cleanId}/verifikasi`, payload)
        } catch (e2) {
          if (e2.response?.status === 404 || e2.response?.status === 405) {
            try {
              await api.put(`/transaksi/${cleanId}/status`, payload)
            } catch (e3) {
              if (e3.response?.status === 404 || e3.response?.status === 405) {
                await api.put(`/transaksi/${cleanId}`, payload)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Backend update status route belum merespons, status telah diverifikasi secara lokal.', error.message)
  }

  return { success: true, status: newStatus }
}

/**
 * Menghitung jumlah transaksi yang masih pending (butuh verifikasi)
 */
export const getPendingCount = async () => {
  try {
    const orders = await fetchOrders(true)
    return orders.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length
  } catch (e) {
    return 0
  }
}

export const getAllTransactions = async () => {
  try {
    return await fetchOrders(true)
  } catch (error) {
    console.error('Gagal fetch transaksi:', error)
    return getLocalOrders()
  }
}
