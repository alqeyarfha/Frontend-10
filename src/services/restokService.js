/**
 * Restok/Purchase Order Service
 * Mengelola pesanan restok produk
 */

import api from './api'

/**
 * Buat pesanan restok baru
 */
export const createRestokOrder = async (payload) => {
  try {
    // Coba post ke API
    const response = await api.post('/restok', payload)
    return response.data
  } catch (apiError) {
    console.warn('API gagal, simpan ke localStorage:', apiError)
    
    // Fallback: simpan ke localStorage
    const existingOrders = JSON.parse(localStorage.getItem('restok_orders') || '[]')
    const newOrder = {
      id: Date.now(),
      ...payload,
      created_at: new Date().toISOString(),
      status: payload.status || 'pending'
    }
    
    existingOrders.push(newOrder)
    localStorage.setItem('restok_orders', JSON.stringify(existingOrders))
    
    return newOrder
  }
}

/**
 * Ambil semua pesanan restok
 */
export const getAllRestokOrders = async () => {
  try {
    const response = await api.get('/restok')
    return response.data.data || response.data || []
  } catch (error) {
    console.error('Gagal ambil restok orders dari API:', error)
    
    // Fallback ke localStorage
    return JSON.parse(localStorage.getItem('restok_orders') || '[]')
  }
}

/**
 * Update status pesanan restok
 */
export const updateRestokOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await api.put(`/restok/${orderId}`, { status: newStatus })
    return response.data
  } catch (apiError) {
    console.warn('API gagal, update localStorage:', apiError)
    
    // Fallback: update di localStorage
    const orders = JSON.parse(localStorage.getItem('restok_orders') || '[]')
    const order = orders.find(o => o.id === orderId)
    
    if (order) {
      order.status = newStatus
      order.updated_at = new Date().toISOString()
      localStorage.setItem('restok_orders', JSON.stringify(orders))
    }
    
    return order
  }
}

/**
 * Hapus pesanan restok
 */
export const deleteRestokOrder = async (orderId) => {
  try {
    await api.delete(`/restok/${orderId}`)
    return true
  } catch (apiError) {
    console.warn('API gagal, hapus dari localStorage:', apiError)
    
    // Fallback: hapus dari localStorage
    const orders = JSON.parse(localStorage.getItem('restok_orders') || '[]')
    const filtered = orders.filter(o => o.id !== orderId)
    localStorage.setItem('restok_orders', JSON.stringify(filtered))
    
    return true
  }
}

/**
 * Get restok orders berdasarkan produk ID
 */
export const getRestokOrdersByProduct = async (produktId) => {
  try {
    const response = await api.get(`/restok?produk_id=${produktId}`)
    return response.data.data || response.data || []
  } catch (error) {
    // Fallback ke localStorage
    const orders = JSON.parse(localStorage.getItem('restok_orders') || '[]')
    return orders.filter(o => o.produk_id === produktId)
  }
}

export default {
  createRestokOrder,
  getAllRestokOrders,
  updateRestokOrderStatus,
  deleteRestokOrder,
  getRestokOrdersByProduct
}
