/**
 * Data Sync Utilities
 * Mengelola sinkronisasi data antara Frontend dan Backend
 */

import api from '../services/api'
import { getAllTransactions } from '../services/transaksiService'

/**
 * Fetch all transactions/orders
 */
export const syncTransactions = async () => {
  try {
    return await getAllTransactions()
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return []
  }
}

/**
 * Fetch all products
 */
export const syncProducts = async () => {
  try {
    const response = await api.get('/produk')
    const data = response.data?.data || response.data || []
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error syncing products:', error)
    return []
  }
}

/**
 * Fetch dashboard summary
 */
export const syncDashboard = async () => {
  try {
    const response = await api.get('/dashboard')
    return response.data?.data || response.data || {}
  } catch (error) {
    console.error('Error syncing dashboard:', error)
    return {}
  }
}

/**
 * Generate report untuk laporan penjualan
 */
export const generateSalesReport = async (month, year) => {
  try {
    const transactions = await syncTransactions()
    
    return {
      month,
      year,
      totalRevenue: transactions.reduce((sum, t) => sum + (parseFloat(t.total_harga) || 0), 0),
      totalOrders: transactions.length,
      averageOrder: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + (parseFloat(t.total_harga) || 0), 0) / transactions.length
        : 0,
      transactions: transactions.filter(t => {
        const date = new Date(t.tanggal || t.created_at)
        return date.getMonth() + 1 === month && date.getFullYear() === year
      })
    }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return { month, year, totalRevenue: 0, totalOrders: 0, averageOrder: 0, transactions: [] }
  }
}

/**
 * Generate stock monitoring report
 */
export const generateStockReport = async () => {
  try {
    const products = await syncProducts()
    
    const critical = products.filter(p => parseInt(p.stok || 0) === 0)
    const low = products.filter(p => {
      const stok = parseInt(p.stok || 0)
      const min = parseInt(p.stok_minimum || 10)
      return stok > 0 && stok <= min
    })
    const safe = products.filter(p => {
      const stok = parseInt(p.stok || 0)
      const min = parseInt(p.stok_minimum || 10)
      return stok > min
    })
    
    return {
      total: products.length,
      critical: critical.length,
      low: low.length,
      safe: safe.length,
      criticalProducts: critical,
      lowProducts: low,
      allProducts: products
    }
  } catch (error) {
    console.error('Error generating stock report:', error)
    return { total: 0, critical: 0, low: 0, safe: 0, criticalProducts: [], lowProducts: [], allProducts: [] }
  }
}

/**
 * Check API connectivity
 */
export const checkAPIConnectivity = async () => {
  try {
    await api.get('/produk')
    return { connected: true, message: 'Connected to backend' }
  } catch (error) {
    return { connected: false, message: error.message }
  }
}

export default {
  syncTransactions,
  syncProducts,
  syncDashboard,
  generateSalesReport,
  generateStockReport,
  checkAPIConnectivity
}
