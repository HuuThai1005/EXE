import { useEffect, useState } from 'react'
import { Pencil, Save, Trash2 } from 'lucide-react'
import { api, resolveImageUrl } from '../services/api'
import AdminSidebar from './AdminSidebar'
import ImageUploadField from './ImageUploadField'

type Mode = 'products' | 'stories' | 'qr'
type Product = { id: number; name: string; slug: string; description: string; price: number; thumbnailUrl: string; status: string }
type Story = { id: number; title: string; slug: string; summary: string; category: string; coverImage: string; readingTime: number }
type QrToken = { id: number; token: string; status: string; productId: number | null; productName: string | null }

const labels: Record<Mode, string> = { products: 'Sản phẩm', stories: 'Stories', qr: 'Mã QR' }
const endpoints: Record<Mode, string> = { products: '/admin/products', stories: '/admin/stories', qr: '/admin/qr-tokens' }
const qrImage = (token: string) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(token)}`

export default function AdminManagement({ mode }: { mode: Mode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [stories, setStories] = useState<Story[]>([])
    const [qrTokens, setQrTokens] = useState<QrToken[]>([])
    const [editing, setEditing] = useState<Product | Story>()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)

    const load = async () => {
        setError('')
        try {
            if (mode === 'products') setProducts((await api.get<{ data: Product[] }>('/admin/products')).data.data)
            if (mode === 'stories') setStories((await api.get<{ data: Story[] }>('/admin/stories')).data.data)
            if (mode === 'qr') setQrTokens((await api.get<{ data: QrToken[] }>('/admin/qr-tokens')).data.data)
        } catch { setError('Không thể tải dữ liệu quản trị.') }
    }

    useEffect(() => { setEditing(undefined); setMessage(''); load() }, [mode])

    const remove = async (id: number) => {
        const question = mode === 'qr'
            ? 'Xóa mã QR này? Lịch sử quét của mã sẽ bị xóa (điểm người dùng đã nhận được giữ nguyên) và mã in trên bao bì sẽ không dùng được nữa.'
            : 'Bạn có chắc muốn xóa mục này?'
        if (!window.confirm(question)) return
        setError('')
        setMessage('')
        try {
            await api.delete(`${endpoints[mode]}/${id}`)
            setMessage('Đã xóa thành công.')
            load()
        } catch (requestError: any) {
            setError(String(requestError.response?.data?.message || 'Không thể xóa mục này.'))
        }
    }

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!editing || uploading) return
        setError('')
        const form = Object.fromEntries(new FormData(event.currentTarget).entries())
        const payload = mode === 'products'
            ? { ...form, price: Number(form.price) }
            : { ...form, readingTime: Number(form.readingTime) }
        try {
            await api.put(`${endpoints[mode]}/${editing.id}`, payload)
            setMessage('Đã cập nhật thành công.')
            setEditing(undefined)
            load()
        } catch (requestError: any) {
            setError(String(requestError.response?.data?.message || 'Không thể cập nhật dữ liệu.'))
        }
    }

    const items = mode === 'products' ? products : stories
    return <main className="page admin"><div className="admin-layout"><AdminSidebar active={mode} /><div className="admin-main"><div className="section-wrap admin-management">
        <div className="admin-heading"><div><p className="eyebrow">ADMIN / MANAGEMENT</p><h1>Quản lý<br /><em>{labels[mode]}.</em></h1><p>Xem lại, cập nhật hoặc xóa nội dung trong hệ thống.</p></div><span className="admin-status">{mode === 'qr' ? qrTokens.length : items.length} ITEMS</span></div>
        {message && <p className="admin-message success" role="status">{message}</p>}
        {error && <p className="admin-message error" role="alert">{error}</p>}
        {editing && mode !== 'qr' && <form className="admin-form management-edit-form" onSubmit={save}>
            <div className="admin-form-heading"><h2>Sửa {mode === 'products' ? 'sản phẩm' : 'story'}</h2><button type="button" className="icon-btn" aria-label="Đóng" onClick={() => setEditing(undefined)}>×</button></div>
            {mode === 'products' ? <><label>TÊN SẢN PHẨM<input name="name" required defaultValue={(editing as Product).name} /></label><div className="form-pair"><label>SLUG<input name="slug" required defaultValue={(editing as Product).slug} /></label><label>GIÁ<input name="price" type="number" min="1" required defaultValue={(editing as Product).price} /></label></div><label>MÔ TẢ<textarea name="description" defaultValue={(editing as Product).description || ''} /></label><ImageUploadField key={editing.id} name="thumbnailUrl" label="ẢNH SẢN PHẨM" defaultValue={(editing as Product).thumbnailUrl} onUploadingChange={setUploading} /></> : <><label>TIÊU ĐỀ<input name="title" required defaultValue={(editing as Story).title} /></label><div className="form-pair"><label>SLUG<input name="slug" required defaultValue={(editing as Story).slug} /></label><label>THỂ LOẠI<input name="category" required defaultValue={(editing as Story).category} /></label></div><label>TÓM TẮT<textarea name="summary" defaultValue={(editing as Story).summary || ''} /></label><div className="form-pair"><label>ẢNH COVER<input name="coverImage" type="url" defaultValue={(editing as Story).coverImage || ''} /></label><label>THỜI GIAN ĐỌC<input name="readingTime" type="number" min="1" required defaultValue={(editing as Story).readingTime} /></label></div></>}
            <button className="button dark" type="submit" disabled={uploading}><Save size={16} /> {uploading ? 'Đang tải ảnh...' : 'Lưu thay đổi'}</button>
        </form>}
        {mode === 'qr' ? <div className="management-table qr-management-table"><div className="management-row management-header"><span>ẢNH QR</span><span>MÃ TOKEN</span><span>SẢN PHẨM LIÊN KẾT</span><span>TRẠNG THÁI</span><span /></div>{qrTokens.map(qr => <div className="management-row" key={qr.id}><img className="qr-preview" src={qrImage(qr.token)} alt={`QR ${qr.token}`} /><strong>{qr.token}</strong><span>{qr.productName || 'Chưa liên kết'}{qr.productId ? ` (#${qr.productId})` : ''}</span><span className="status-pill">{qr.status}</span><div className="management-actions"><button className="icon-btn danger" aria-label={`Xóa mã QR ${qr.token}`} onClick={() => remove(qr.id)}><Trash2 size={16} /></button></div></div>)}</div> : <div className="management-table">{(items as (Product | Story)[]).map(item => <div className="management-row" key={item.id}><div className="product-thumb">{'name' in item && <img src={resolveImageUrl(item.thumbnailUrl) || '/storybox_product.png'} alt="" onError={event => { event.currentTarget.src = '/storybox_product.png' }} />}<div><strong>{'name' in item ? item.name : item.title}</strong><small>{item.slug}</small></div></div><span>{'name' in item ? `${item.price.toLocaleString('vi-VN')}đ` : item.category}</span><div className="management-actions"><button className="icon-btn" aria-label="Sửa" onClick={() => setEditing(item)}><Pencil size={16} /></button><button className="icon-btn danger" aria-label="Xóa" onClick={() => remove(item.id)}><Trash2 size={16} /></button></div></div>)}</div>}
    </div></div></div></main>
}
