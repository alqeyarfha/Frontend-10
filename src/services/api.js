import axios from 'axios'

const api = axios.create({
  baseURL: 'http://10.10.9.4:5173/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Pasang Bearer Token dan handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Jika data adalah FormData, hapus Content-Type agar browser set dengan benar (termasuk boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

export default api