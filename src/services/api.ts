import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('mekong_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) localStorage.removeItem('mekong_access_token')
    return Promise.reject(error)
})

/** Ảnh upload được lưu dạng "/api/images/{id}"; khi frontend gọi API ở domain khác thì nối với VITE_API_BASE_URL. */
export function resolveImageUrl(url?: string | null) {
    const base = import.meta.env.VITE_API_BASE_URL
    if (!url || !base || !url.startsWith('/api/')) return url ?? undefined
    return base.replace(/\/$/, '') + url.slice('/api'.length)
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1600

/** Thu nhỏ ảnh về tối đa 1600px và nén WEBP/JPEG trước khi upload để tiết kiệm dung lượng database. */
async function compressImage(file: File): Promise<Blob> {
    if (file.type === 'image/gif') return file // giữ nguyên ảnh động
    const objectUrl = URL.createObjectURL(file)
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image()
            element.onload = () => resolve(element)
            element.onerror = () => reject(new Error('Không đọc được file ảnh.'))
            element.src = objectUrl
        })
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.naturalWidth * scale)
        canvas.height = Math.round(image.naturalHeight * scale)
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
        const toBlob = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85))
        let blob = await toBlob('image/webp')
        if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg')
        return blob && blob.size < file.size ? blob : file
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

export async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn file ảnh (JPG, PNG, WEBP, GIF).')
    const blob = await compressImage(file)
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Ảnh quá lớn, tối đa 5MB.')
    const form = new FormData()
    form.append('file', blob, file.name)
    // Ghi đè Content-Type JSON mặc định, nếu không axios sẽ biến FormData thành JSON
    const response = await api.post<{ data: { url: string } }>('/admin/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data.data.url
}
