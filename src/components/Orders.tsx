import { useEffect, useState } from 'react'
import { ArrowRight, Check, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { OrderStatus, orderProgressSteps, orderStatusLabels } from '../services/orderStatus'

type Order = {
    id: number
    orderCode: string
    orderType: 'PURCHASE' | 'REDEMPTION'
    passportPointsSpent: number
    status: OrderStatus
    paymentMethod: 'PREPAID_QR' | 'COD' | 'REDEMPTION'
    paymentStatus: 'PENDING' | 'UNPAID' | 'PAID' | 'NOT_REQUIRED'
    shippingCarrier: string | null
    trackingNumber: string | null
    totalAmount: number
    createdAt: string
    items: { productName: string; unitPrice: number; quantity: number }[]
    statusHistory: { status: OrderStatus; note: string; createdAt: string }[]
}

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'
const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [confirmingId, setConfirmingId] = useState<number>()
    const [actionError, setActionError] = useState('')

    const confirmReceived = async (orderId: number) => {
        setConfirmingId(orderId)
        setActionError('')
        try {
            await api.post(`/orders/${orderId}/confirm-received`)
            const response = await api.get<{ data: Order[] }>('/orders')
            setOrders(response.data.data)
        } catch {
            setActionError('Không thể xác nhận đã nhận hàng. Vui lòng tải lại đơn và thử lại.')
        } finally {
            setConfirmingId(undefined)
        }
    }

    useEffect(() => {
        api.get<{ data: Order[] }>('/orders')
            .then(response => setOrders(response.data.data))
            .catch(requestError => setError(requestError.response?.status === 401 || requestError.response?.status === 403
                ? 'Đăng nhập để xem đơn hàng của bạn.'
                : 'Không thể tải đơn hàng lúc này.'))
            .finally(() => setLoading(false))
    }, [])

    return <main className="page orders-page"><div className="section-wrap"><p className="eyebrow">Hành trình · Đơn hàng</p><h1>Đơn hàng<br /><em>của bạn.</em></h1>
        {loading && <p role="status">Đang tải đơn hàng...</p>}
        {error && <p role="alert">{error} <Link to="/login" state={{ from: '/orders' }}>Đăng nhập <ArrowRight size={14} /></Link></p>}
        {actionError && <p role="alert">{actionError}</p>}
        {!loading && !error && orders.length === 0 && <div className="orders-empty"><Package size={30} /><p>Bạn chưa có đơn hàng nào.</p><Link className="button dark" to="/products">Khám phá sản phẩm <ArrowRight size={16} /></Link></div>}
        {!loading && orders.length > 0 && <div className="order-history-list">{orders.map(order => {
            const currentStep = orderProgressSteps.findIndex(step => step.status === order.status)
            return <article className="order-history-card" key={order.id}>
                <header className="order-history-header"><div><span className="number-label">{order.orderCode} · {order.orderType === 'REDEMPTION' ? `ĐỔI QUÀ · ${order.passportPointsSpent} ĐIỂM` : 'ĐƠN MUA'}</span><small>Đặt ngày {formatDate(order.createdAt)}</small><small className={`payment-status payment-status-${order.paymentStatus.toLowerCase()}`}>{order.paymentMethod === 'PREPAID_QR' ? 'QR chuyển khoản' : order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Đổi điểm'} · {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : order.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : order.paymentStatus === 'UNPAID' ? 'Thanh toán khi nhận' : 'Không cần thanh toán'}</small></div><strong className={`order-status order-status-${order.status.toLowerCase()}`}>{orderStatusLabels[order.status]}</strong></header>
                {order.status === 'CANCELLED' ? <p className="order-cancelled-note">Đơn hàng này đã được hủy.</p> : <div className="order-progress" aria-label={`Tiến trình: ${orderStatusLabels[order.status]}`}>
                    {orderProgressSteps.map((step, index) => <div className={`order-progress-step ${index <= currentStep ? 'complete' : ''}`} key={step.status}><span>{index + 1}</span><small>{step.label}</small></div>)}
                </div>}
                {order.shippingCarrier && <div className="customer-shipping-details"><span>ĐƠN VỊ VẬN CHUYỂN <strong>{order.shippingCarrier}</strong></span><span>MÃ VẬN ĐƠN <strong>{order.trackingNumber}</strong></span></div>}
                <div className="order-history-lines">{order.items.map((item, index) => <div className="order-history-line" key={`${order.id}-${index}`}><span>{item.productName} × {item.quantity}</span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}</div>
                <div className="order-history-footer"><div><span>CẬP NHẬT TIẾN TRÌNH</span>{order.statusHistory.map((event, index) => <p key={`${event.status}-${index}`}><b>{orderStatusLabels[event.status]}</b><small>{event.note} · {formatDate(event.createdAt)}</small></p>)}{order.status === 'SHIPPED' && <button className="button dark confirm-received" disabled={confirmingId === order.id} onClick={() => void confirmReceived(order.id)}>{confirmingId === order.id ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'} <Check size={15} /></button>}</div><strong>{money(order.totalAmount)}</strong></div>
            </article>
        })}</div>}
    </div></main>
}