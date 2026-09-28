import { ClipboardList, FileText, LayoutDashboard, Package, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type AdminView = 'dashboard' | 'products' | 'stories' | 'qr' | 'orders'

export default function AdminSidebar({ active }: { active: AdminView }) {
    const navigate = useNavigate()
    const items: { view: AdminView; label: string; icon: typeof LayoutDashboard; path: string }[] = [
        { view: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, path: '/admin' },
        { view: 'products', label: 'Sản phẩm', icon: Package, path: '/admin/products' },
        { view: 'stories', label: 'Stories', icon: FileText, path: '/admin/stories' },
        { view: 'qr', label: 'Liên kết QR', icon: QrCode, path: '/admin/qr-tokens' },
        { view: 'orders', label: 'Đơn hàng', icon: ClipboardList, path: '/admin/orders' },
    ]
    return <aside className="admin-nav"><div className="admin-nav-brand"><span className="brand-mark">MS</span><div>MEKONG<strong>ADMIN</strong></div></div><div className="admin-nav-label">WORKSPACE</div><nav>{items.map(item => { const Icon = item.icon; return <button className={active === item.view ? 'active' : ''} key={item.view} onClick={() => navigate(item.path)}><Icon size={17} /><span>{item.label}</span></button> })}</nav><div className="admin-nav-footer">CONTROL ROOM<br /><span>MEKONG STORY BOX</span></div></aside>
}
