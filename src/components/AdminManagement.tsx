import { useEffect, useState } from 'react'
import { Ban, Pencil, Printer, Save, Trash2 } from 'lucide-react'
import { api, resolveImageUrl } from '../services/api'
import AdminSidebar from './AdminSidebar'
import ImageUploadField from './ImageUploadField'

type Mode = 'products' | 'stories' | 'qr'
type Product = { id: number; name: string; slug: string; description: string; price: number; thumbnailUrl: string; status: string }
type Story = { id: number; title: string; slug: string; summary: string; category: string; coverImage: string; readingTime: number }
type QrStatus = 'ACTIVE' | 'USED' | 'REVOKED'
type QrToken = { id: number; token: string; status: QrStatus; usedAt: string | null; productId: number | null; productName: string | null }

const labels: Record<Mode, string> = { products: 'Sản phẩm', stories: 'Stories', qr: 'Mã QR' }
const endpoints: Record<Mode, string> = { products: '/admin/products', stories: '/admin/stories', qr: '/admin/qr-tokens' }
const qrImage = (token: string, size = 160) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&ecc=M&data=${encodeURIComponent(token)}`
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))
const qrStatusLabels: Record<QrStatus, string> = { ACTIVE: 'Chưa quét', USED: 'Đã quét', REVOKED: 'Đã thu hồi' }

/** Mở cửa sổ in: một mã thì in khổ lớn (~12cm), nhiều mã thì in dạng lưới tem để cắt dán lên từng hộp. Tự gọi hộp thoại in khi ảnh đã tải xong. */
function printQr(codes: QrToken[]) {
    const printWindow = window.open('', '_blank', 'width=720,height=900')
    if (!printWindow) {
        window.alert('Trình duyệt đã chặn cửa sổ in. Hãy cho phép popup cho trang này rồi thử lại.')
        return
    }
    const single = codes.length === 1
    const cards = codes.map(qr => {
        const token = escapeHtml(qr.token)
        const product = qr.productName ? escapeHtml(qr.productName) : 'Chưa liên kết sản phẩm'
        return `<section class="card"><div class="brand">MEKONG STORY BOX · DIGITAL PASSPORT</div><img src="${qrImage(qr.token, single ? 1000 : 500)}" alt="QR ${token}"><p class="product">${product}</p><div class="token">${token}</div></section>`
    }).join('')
    printWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>In ${codes.length} mã QR</title><style>
        @page { size: A4 portrait; margin: ${single ? 16 : 10}mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #12332f; background: #fff; }
        .card { display: grid; justify-items: center; gap: 6px; text-align: center; }
        .brand { font-size: 8px; font-weight: 700; letter-spacing: .2em; }
        img { width: 42mm; height: 42mm; image-rendering: pixelated; }
        .product { font-size: 11px; font-weight: 700; margin: 0; }
        .token { font-family: ui-monospace, Consolas, monospace; font-size: 9px; padding: 3px 8px; border: 1px dashed #12332f; border-radius: 6px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm 6mm; }
        .grid .card { padding: 4mm; border: 1px dotted #9aa; break-inside: avoid; }
        .single { min-height: calc(100vh - 32px); display: grid; place-content: center; gap: 14px; padding: 16px; }
        .single .card { gap: 14px; }
        .single .brand { font-size: 13px; letter-spacing: .24em; }
        .single img { width: 120mm; height: 120mm; }
        .single .product { font-size: 22px; margin-top: 4px; }
        .single .token { font-size: 16px; padding: 6px 14px; border-width: 1.5px; border-radius: 8px; }
        .hint { font-size: 13px; color: #555; max-width: 120mm; text-align: center; justify-self: center; }
        .loading { font-size: 14px; color: #555; text-align: center; }
        @media print { .loading { display: none; } }
    </style></head><body><p class="loading" id="loading">Đang tải ${codes.length} mã QR...</p><main class="${single ? 'single' : 'grid'}">${cards}
        ${single ? '<p class="hint">Quét mã bằng trang "Quét QR" trên Mekong Story Box để mở khóa câu chuyện và tích điểm vào Digital Passport. Mỗi mã chỉ dùng được một lần.</p>' : ''}
    </main><script>
        const images = Array.from(document.images);
        let pending = images.length;
        const ready = () => { if (--pending > 0) return; document.getElementById('loading').remove(); setTimeout(() => window.print(), 150); };
        images.forEach(image => {
            if (image.complete && image.naturalWidth) return ready();
            image.addEventListener('load', ready);
            image.addEventListener('error', () => { document.getElementById('loading').textContent = 'Không tải được ảnh QR. Kiểm tra kết nối mạng rồi thử lại.'; });
        });
        window.addEventListener('afterprint', () => window.close());
    </script></body></html>`)
    printWindow.document.close()
    printWindow.focus()
}

export default function AdminManagement({ mode }: { mode: Mode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [stories, setStories] = useState<Story[]>([])
    const [qrTokens, setQrTokens] = useState<QrToken[]>([])
    const [editing, setEditing] = useState<Product | Story>()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [qrProductFilter, setQrProductFilter] = useState('')
    const [qrStatusFilter, setQrStatusFilter] = useState<QrStatus | ''>('')

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
            ? 'Xóa mã QR này? Lịch sử quét của mã sẽ bị xóa (điểm người dùng đã nhận được giữ nguyên) và mã in trên bao bì sẽ không dùng được nữa. Nếu chỉ muốn vô hiệu hóa mã chưa quét, hãy dùng Thu hồi để giữ lại lịch sử.'
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

    const revoke = async (qr: QrToken) => {
        if (!window.confirm(`Thu hồi mã ${qr.token}? Mã sẽ không quét được nữa và không thể khôi phục.`)) return
        setError('')
        setMessage('')
        try {
            await api.post(`/admin/qr-tokens/${qr.id}/revoke`)
            setMessage('Đã thu hồi mã QR.')
            load()
        } catch (requestError: any) {
            setError(String(requestError.response?.data?.message || 'Không thể thu hồi mã QR.'))
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
    const qrProducts = [...new Map(qrTokens.filter(qr => qr.productId).map(qr => [qr.productId!, qr.productName || `#${qr.productId}`])).entries()]
    const visibleQrTokens = qrTokens.filter(qr => (!qrProductFilter || String(qr.productId) === qrProductFilter) && (!qrStatusFilter || qr.status === qrStatusFilter))
    const printableQrTokens = visibleQrTokens.filter(qr => qr.status === 'ACTIVE')
    return <main className="page admin"><div className="admin-layout"><AdminSidebar active={mode} /><div className="admin-main"><div className="section-wrap admin-management">
        <div className="admin-heading"><div><p className="eyebrow">ADMIN / MANAGEMENT</p><h1>Quản lý<br /><em>{labels[mode]}.</em></h1><p>Xem lại, cập nhật hoặc xóa nội dung trong hệ thống.</p></div><span className="admin-status">{mode === 'qr' ? qrTokens.length : items.length} ITEMS</span></div>
        {message && <p className="admin-message success" role="status">{message}</p>}
        {error && <p className="admin-message error" role="alert">{error}</p>}
        {editing && mode !== 'qr' && <form className="admin-form management-edit-form" onSubmit={save}>
            <div className="admin-form-heading"><h2>Sửa {mode === 'products' ? 'sản phẩm' : 'story'}</h2><button type="button" className="icon-btn" aria-label="Đóng" onClick={() => setEditing(undefined)}>×</button></div>
            {mode === 'products' ? <><label>TÊN SẢN PHẨM<input name="name" required defaultValue={(editing as Product).name} /></label><div className="form-pair"><label>SLUG<input name="slug" required defaultValue={(editing as Product).slug} /></label><label>GIÁ<input name="price" type="number" min="1" required defaultValue={(editing as Product).price} /></label></div><label>MÔ TẢ<textarea name="description" defaultValue={(editing as Product).description || ''} /></label><ImageUploadField key={editing.id} name="thumbnailUrl" label="ẢNH SẢN PHẨM" defaultValue={(editing as Product).thumbnailUrl} onUploadingChange={setUploading} /></> : <><label>TIÊU ĐỀ<input name="title" required defaultValue={(editing as Story).title} /></label><div className="form-pair"><label>SLUG<input name="slug" required defaultValue={(editing as Story).slug} /></label><label>THỂ LOẠI<input name="category" required defaultValue={(editing as Story).category} /></label></div><label>TÓM TẮT<textarea name="summary" defaultValue={(editing as Story).summary || ''} /></label><div className="form-pair"><label>ẢNH COVER<input name="coverImage" type="url" defaultValue={(editing as Story).coverImage || ''} /></label><label>THỜI GIAN ĐỌC<input name="readingTime" type="number" min="1" required defaultValue={(editing as Story).readingTime} /></label></div></>}
            <button className="button dark" type="submit" disabled={uploading}><Save size={16} /> {uploading ? 'Đang tải ảnh...' : 'Lưu thay đổi'}</button>
        </form>}
        {mode === 'qr' ? <><div className="qr-toolbar"><select aria-label="Lọc theo sản phẩm" value={qrProductFilter} onChange={event => setQrProductFilter(event.target.value)}><option value="">Tất cả sản phẩm</option>{qrProducts.map(([id, name]) => <option key={id} value={id}>{name} (#{id})</option>)}</select><select aria-label="Lọc theo trạng thái" value={qrStatusFilter} onChange={event => setQrStatusFilter(event.target.value as QrStatus | '')}><option value="">Mọi trạng thái</option>{(Object.keys(qrStatusLabels) as QrStatus[]).map(status => <option key={status} value={status}>{qrStatusLabels[status]}</option>)}</select><button className="button light" disabled={printableQrTokens.length === 0} onClick={() => printQr(printableQrTokens)}><Printer size={16} /> In {printableQrTokens.length} mã chưa quét</button></div><div className="management-table qr-management-table"><div className="management-row management-header"><span>ẢNH QR</span><span>MÃ TOKEN</span><span>SẢN PHẨM LIÊN KẾT</span><span>TRẠNG THÁI</span><span /></div>{visibleQrTokens.map(qr => <div className="management-row" key={qr.id}><img className="qr-preview" src={qrImage(qr.token)} alt={`QR ${qr.token}`} /><strong className="qr-token">{qr.token}</strong><span>{qr.productName || 'Chưa liên kết'}{qr.productId ? ` (#${qr.productId})` : ''}</span><div className="qr-status"><span className={`status-pill qr-status-${qr.status.toLowerCase()}`}>{qrStatusLabels[qr.status] ?? qr.status}</span>{qr.usedAt && <small>{new Date(qr.usedAt).toLocaleString('vi-VN')}</small>}</div><div className="management-actions">{qr.status === 'ACTIVE' && <><button className="icon-btn" aria-label={`In mã QR ${qr.token}`} title="In mã QR khổ lớn" onClick={() => printQr([qr])}><Printer size={16} /></button><button className="icon-btn danger" aria-label={`Thu hồi mã QR ${qr.token}`} title="Thu hồi mã" onClick={() => revoke(qr)}><Ban size={16} /></button></>}<button className="icon-btn danger" aria-label={`Xóa mã QR ${qr.token}`} title="Xóa mã" onClick={() => remove(qr.id)}><Trash2 size={16} /></button></div></div>)}</div></> :<div className="management-table">{(items as (Product | Story)[]).map(item => <div className="management-row" key={item.id}><div className="product-thumb">{'name' in item && <img src={resolveImageUrl(item.thumbnailUrl) || '/storybox_product.png'} alt="" onError={event => { event.currentTarget.src = '/storybox_product.png' }} />}<div><strong>{'name' in item ? item.name : item.title}</strong><small>{item.slug}</small></div></div><span>{'name' in item ? `${item.price.toLocaleString('vi-VN')}đ` : item.category}</span><div className="management-actions"><button className="icon-btn" aria-label="Sửa" onClick={() => setEditing(item)}><Pencil size={16} /></button><button className="icon-btn danger" aria-label="Xóa" onClick={() => remove(item.id)}><Trash2 size={16} /></button></div></div>)}</div>}
    </div></div></div></main>
}
