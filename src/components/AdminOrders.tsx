import { useEffect, useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import { api } from '../services/api'
import { OrderStatus, orderStatusLabels } from '../services/orderStatus'

type AdminOrder = {
    id: number
    orderCode: string
    orderType: 'PURCHASE' | 'REDEMPTION'
    passportPointsSpent: number
    customerName: string
    customerEmail: string
    phone: string
    shippingAddress: string
    shippingCarrier: string | null
    trackingNumber: string | null
    totalAmount: number
    status: OrderStatus
    createdAt: string
}

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: [],
    DELIVERED: [],
    CANCELLED: [],
}
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'
const date = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminOrders() {
    const [orders, setOrders] = useState<AdminOrder[]>([])
    const [drafts, setDrafts] = useState<Record<number, OrderStatus>>({})
    const [carriers, setCarriers] = useState<Record<number, string>>({})
    const [trackingNumbers, setTrackingNumbers] = useState<Record<number, string>>({})
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<number>()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const load = async () => {
        setError('')
        try {
            const response = await api.get<{ data: AdminOrder[] }>('/admin/orders')
            setOrders(response.data.data)
            setDrafts(Object.fromEntries(response.data.data.map(order => [order.id, order.status])))
            setCarriers(Object.fromEntries(response.data.data.map(order => [order.id, order.shippingCarrier ?? ''])))
            setTrackingNumbers(Object.fromEntries(response.data.data.map(order => [order.id, order.trackingNumber ?? ''])))
        } catch {
            setError('Không thể tải đơn hàng. Hãy kiểm tra quyền ADMIN và trạng thái backend.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { void load() }, [])

    const updateStatus = async (order: AdminOrder) => {
        const status = drafts[order.id]
        if (!status || status === order.status) return
        setSavingId(order.id)
        setError('')
        setMessage('')
        try {
            await api.put(`/admin/orders/${order.id}/status`, {
                status,
                shippingCarrier: carriers[order.id] ?? '',
                trackingNumber: trackingNumbers[order.id] ?? '',
            })
            setMessage(`Đã cập nhật ${order.orderCode}.`)
            await load()
        } catch {
            setError('Không thể cập nhật trạng thái. Chỉ được chuyển sang bước kế tiếp hợp lệ.')
        } finally {
            setSavingId(undefined)
        }
    }

    return <main className="page admin"><div className="admin-layout"><AdminSidebar active="orders" /><div className="admin-main"><div className="section-wrap admin-management order-admin-management">
        <div className="admin-heading"><div><p className="eyebrow">ADMIN / FULFILLMENT</p><h1>The order<br /><em>desk.</em></h1><p>Kiểm tra thông tin giao nhận và cập nhật tiến trình đơn hàng.</p></div><button className="icon-btn" aria-label="Tải lại đơn hàng" onClick={() => void load()}><RefreshCw size={16} /></button></div>
        {message && <p className="admin-message success" role="status">{message}</p>}
        {error && <p className="admin-message error" role="alert">{error}</p>}
        {loading ? <p role="status">Đang tải đơn hàng...</p> : orders.length === 0 ? <p>Chưa có đơn hàng nào.</p> : <div className="admin-order-list">{orders.map(order => <article className="admin-order-card" key={order.id}>
            <div className="admin-order-heading"><div><span className="number-label">{order.orderCode} · {order.orderType === 'REDEMPTION' ? `ĐỔI QUÀ ${order.passportPointsSpent} ĐIỂM` : 'ĐƠN MUA'}</span><strong>{order.customerName}</strong><small>{order.customerEmail} · {date(order.createdAt)}</small></div><strong>{money(order.totalAmount)}</strong></div>
            <div className="admin-order-shipping"><span>{order.phone}</span><span>{order.shippingAddress}</span>{order.shippingCarrier && <span>Đơn vị vận chuyển: {order.shippingCarrier}</span>}{order.trackingNumber && <span>Mã vận đơn: {order.trackingNumber}</span>}</div>
            <div className="admin-order-controls"><span className={`order-status order-status-${order.status.toLowerCase()}`}>{orderStatusLabels[order.status]}</span><select aria-label={`Trạng thái ${order.orderCode}`} value={drafts[order.id] ?? order.status} onChange={event => setDrafts(current => ({ ...current, [order.id]: event.target.value as OrderStatus }))}><option value={order.status}>{orderStatusLabels[order.status]}</option>{nextStatuses[order.status].map(status => <option value={status} key={status}>{orderStatusLabels[status]}</option>)}</select>{drafts[order.id] === 'SHIPPED' && <div className="admin-shipping-fields"><label>ĐƠN VỊ VẬN CHUYỂN<input maxLength={100} value={carriers[order.id] ?? ''} placeholder="VD: Giao Hàng Nhanh" onChange={event => setCarriers(current => ({ ...current, [order.id]: event.target.value }))} /></label><label>MÃ VẬN ĐƠN<input maxLength={100} value={trackingNumbers[order.id] ?? ''} placeholder="Nhập mã vận đơn" onChange={event => setTrackingNumbers(current => ({ ...current, [order.id]: event.target.value }))} /></label></div>}<button className="button dark" disabled={!drafts[order.id] || drafts[order.id] === order.status || savingId === order.id || (drafts[order.id] === 'SHIPPED' && (!carriers[order.id]?.trim() || !trackingNumbers[order.id]?.trim()))} onClick={() => void updateStatus(order)}><Save size={15} />{savingId === order.id ? 'Đang lưu...' : 'Cập nhật'}</button></div>
        </article>)}</div>}
    </div></div></div></main>
}