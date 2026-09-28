import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Camera, Check, ChevronDown, Compass, Crown, FileText, Globe, Menu, Minus, Package, Plus, QrCode, ShieldCheck, ShoppingBag, Stamp, X } from 'lucide-react'
import { api } from './services/api'
import { AuthUser, currentUser, login, logout, register } from './services/authService'
import QrScanner from './components/QrScanner'
import AdminManagement from './components/AdminManagement'
import AdminOrders from './components/AdminOrders'
import AdminSidebar from './components/AdminSidebar'
import Orders from './components/Orders'

type Story = { id: number; slug: string; title: string; category: string; readingTime: number; coverImage: string; summary: string }
type Product = { id: number; name: string; slug: string; price: number; thumbnailUrl: string; description: string }
type CartItem = { product: Product; quantity: number }
type CheckoutDetails = { customerName: string; phone: string; shippingAddress: string }
type OrderResult = { orderCode: string; totalAmount: number; passportPointsAwarded: number }
type ProductPage = { data: Product[]; page: number; size: number; totalPages: number; totalElements: number }
type DemoQrToken = { token: string; label: string; location: string; description: string }
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'
const getStories = () => api.get<{ data: Story[] }>('/stories').then(response => response.data.data)
const getProducts = (page = 0, size = 6) => api.get<ProductPage>('/products', { params: { page, size } }).then(response => response.data)
const getAllProducts = async () => {
    const firstPage = await getProducts(0, 50)
    if (firstPage.totalPages <= 1) return firstPage.data
    const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getProducts(index + 1, 50)),
    )
    return [...firstPage.data, ...remainingPages.flatMap(page => page.data)]
}
const getProduct = () => getProducts(0, 1).then(response => response.data[0])
const demoQrTokens: DemoQrToken[] = [
    { token: 'demo-can-tho-001', label: 'Cần Thơ #001', location: 'Floating Market', description: 'Chợ nổi lúc bình minh' },
    { token: 'mekong-market-002', label: 'Bến Tre #002', location: 'Mekong Market', description: 'Mùi dừa và bến sông' },
    { token: 'mekong-garden-003', label: 'Mekong Garden #003', location: 'Garden Trail', description: 'Bên vườn dừa xanh' },
    { token: 'southern-music-004', label: 'Southern Music #004', location: 'River Stage', description: 'Giai điệu sông nước' },
]
const getQrCodeUrl = (token: string) => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(token)}`
function Shell({ children, cartCount, user, onLogout }: { children: React.ReactNode; cartCount: number; user?: AuthUser; onLogout: () => void }) {
    const [open, setOpen] = useState(false)
    const location = useLocation()
    if (location.pathname.startsWith('/admin')) return <div className="admin-app-shell">{children}</div>
    return <div className="app-shell">
        <header className="topbar">
            <Link to="/" className="brand"><span className="brand-mark">MS</span><span>MEKONG<br /><b>STORY BOX</b></span></Link>
            <nav className={open ? 'nav open' : 'nav'}>
                <Link className={location.pathname === '/' ? 'active' : ''} to="/">Trang chủ</Link><Link className={location.pathname === '/products' || location.pathname === '/story-box' ? 'active' : ''} to="/products">Sản phẩm</Link><Link to="/stories">Câu chuyện</Link><Link to="/passport">Digital Passport</Link>{user && <Link className={location.pathname === '/orders' ? 'active' : ''} to="/orders">Đơn hàng</Link>}<Link to="/about">Về chúng tôi</Link>
            </nav>
            <div className="header-actions"><button className="language">VI <ChevronDown size={14} /></button>{user ? <button className="user-action" onClick={onLogout}>{user.fullName} · Thoát</button> : <Link className="user-action" to="/login">Đăng nhập</Link>}<Link aria-label="Giỏ hàng" className="icon-btn cart-link" to="/cart"><ShoppingBag size={19} />{cartCount > 0 && <span>{cartCount}</span>}</Link><button className="menu-btn" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
        </header>{children}
        <footer><div><Link className="brand footer-brand" to="/"><span className="brand-mark">MS</span><span>MEKONG<br /><b>STORY BOX</b></span></Link><p>Một chuyến về miền Tây,<br />nằm trong một chiếc hộp.</p></div><div><strong>Khám phá</strong><Link to="/products">Sản phẩm</Link><Link to="/stories">Câu chuyện</Link><Link to="/passport">Digital Passport</Link></div><div><strong>Theo dõi hành trình</strong><p className="social"><Globe size={18} /><Globe size={18} /></p><small>© 2024 Mekong Story Box</small></div></footer>
    </div>
}

function Home({ addToCart }: { addToCart: (product: Product) => void }) {
    const navigate = useNavigate(); const [stories, setStories] = useState<Story[]>([]); const [product, setProduct] = useState<Product>(); useEffect(() => { getStories().then(setStories).catch(() => setStories([])); getProduct().then(setProduct).catch(() => undefined) }, []); return <main>
        <section className="hero"><div className="hero-copy"><p className="eyebrow"><span /> CULTURAL EXPERIENCE PLATFORM</p><h1>Một chuyến về<br /><em>miền Tây,</em><br />nằm trong một chiếc hộp.</h1><p className="hero-lead">Khám phá hương vị, câu chuyện và ký ức miền sông nước — theo một cách hoàn toàn mới.</p><div className="button-row"><button className="button primary" onClick={() => navigate('/story-box')}>Khám phá Story Box <ArrowRight size={17} /></button><button className="text-button" onClick={() => navigate('/experience')}><QrCode size={17} /> Trải nghiệm miền Tây</button></div></div><div className="hero-art"><div className="sun" /><div className="water" /><div className="leaf leaf-one">✦</div><div className="box-visual"><div className="box-label"><span>MEKONG</span><b>STORY<br />BOX</b><small>CAN THO · 001</small></div></div><span className="art-note note-one">stories<br />from the river</span><span className="art-note note-two">est. 2024</span></div><div className="hero-scroll">SCROLL TO EXPLORE <ArrowRight size={14} /></div></section>
        <section className="intro section-wrap"><div className="section-kicker">01 / THE IDEA</div><div className="intro-grid"><h2>Bạn không mua<br />một chiếc hộp.<br /><em>Bạn mua một câu chuyện.</em></h2><div><p className="large-copy">Story Box là một chuyến du lịch miền Tây thu nhỏ — nơi mỗi món quà mở ra một vùng đất, một người làm ra nó, và một ký ức đáng được kể.</p><Link className="under-link" to="/about">Tìm hiểu câu chuyện của chúng tôi <ArrowRight size={15} /></Link></div></div><div className="steps">{[['01', 'UNBOX', 'Mở hộp và khám phá những món quà từ miền Tây.'], ['02', 'SCAN', 'Quét QR để bước vào trải nghiệm số.'], ['03', 'DISCOVER', 'Khám phá câu chuyện phía sau từng món quà.']].map(([n, t, d]) => <div className="step" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
        {product && <section className="featured section-wrap"><div className="section-kicker">02 / THE FIRST JOURNEY</div><div className="featured-grid"><div className="product-photo"><img src={product.thumbnailUrl} alt={product.name} /><span className="photo-stamp">CẦN THƠ<br />#001</span></div><div className="product-info"><p className="eyebrow">{product.name}</p><h2>Nhịp sống<br /><em>trên sông Hậu.</em></h2><p>{product.description}</p><div className="product-meta"><strong>{money(product.price)}</strong><span>6 món quà · 1 hành trình</span></div><button className="button dark" onClick={() => addToCart(product)}>Thêm vào giỏ <ShoppingBag size={16} /></button><Link className="under-link" to="/story-box">Xem chi tiết sản phẩm <ArrowRight size={15} /></Link></div></div></section>}
        <section className="stories-band"><div className="section-wrap"><div className="band-heading"><div><div className="section-kicker">03 / FROM THE DELTA</div><h2>Những câu chuyện<br /><em>đáng để mang về.</em></h2></div><Link className="under-link light-link" to="/stories">Xem tất cả câu chuyện <ArrowRight size={15} /></Link></div><div className="story-grid">{stories.slice(0, 3).map(story => <StoryCard story={story} key={story.id} />)}</div></div></section>
    </main>
}

function StoryCard({ story }: { story: Story }) { return <Link to={'/stories/' + story.slug} className="story-card"><div className="story-image"><img src={story.coverImage} alt={story.title} /><span>{story.category}</span></div><div className="story-card-body"><small>{story.readingTime} phút đọc</small><h3>{story.title}</h3><p>{story.summary}</p><ArrowRight size={17} /></div></Link> }
function StoryBox({ addToCart }: { addToCart: (product: Product) => void }) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [addedProductId, setAddedProductId] = useState<number>()
    useEffect(() => {
        getAllProducts().then(setProducts).catch(() => setError(true)).finally(() => setLoading(false))
    }, [])
    const addProduct = (product: Product) => {
        addToCart(product)
        setAddedProductId(product.id)
        window.setTimeout(() => setAddedProductId(undefined), 1600)
    }
    return <main className="page"><div className="page-hero"><p className="eyebrow">THE STORY BOX / COLLECTION</p><h1>Một miền sông nước<br /><em>để mang về.</em></h1><p>Đằng sau mỗi món quà là một vùng đất, một người làm ra nó, và một câu chuyện đáng được kể.</p></div><section className="section-wrap product-catalog"><div className="catalog-heading"><div><span className="number-label">ALL PRODUCTS</span><h2>Những hành trình<br /><em>đang chờ bạn.</em></h2></div><span>{products.length} sản phẩm</span></div>{loading ? <p role="status">Đang tải sản phẩm...</p> : error ? <p role="alert">Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.</p> : products.length === 0 ? <p>Hiện chưa có sản phẩm nào.</p> : <div className="product-grid">{products.map(product => <article className="catalog-product" key={product.id}><div className="product-photo"><img src={product.thumbnailUrl} alt={product.name} /></div><div className="catalog-product-info"><span className="number-label">{product.slug}</span><h3>{product.name}</h3><p>{product.description}</p><div className="catalog-product-footer"><strong>{money(product.price)}</strong><button className="button dark" onClick={() => addProduct(product)}>{addedProductId === product.id ? 'Đã thêm' : 'Thêm vào giỏ'} <ShoppingBag size={16} /></button></div></div></article>)}</div>}</section></main>
}
function Stories() { const [stories, setStories] = useState<Story[]>([]); useEffect(() => { getStories().then(setStories).catch(() => setStories([])) }, []); return <main className="page"><div className="page-hero compact"><p className="eyebrow">THE MEKONG JOURNAL</p><h1>Những điều<br /><em>miền Tây kể.</em></h1><p>Chậm rãi một chút. Lắng nghe kỹ hơn. Mỗi câu chuyện là một cánh cửa nhỏ dẫn về miền sông nước.</p></div><section className="section-wrap journal"><div className="filters"><span>ALL STORIES</span>{['FOOD', 'PEOPLE', 'PLACES', 'CRAFTS', 'MUSIC', 'LIFESTYLE'].map(x => <button key={x}>{x}</button>)}</div><div className="journal-grid">{stories.map(story => <StoryCard story={story} key={story.id} />)}</div></section></main> }
function Experience() { const navigate = useNavigate(); return <main className="experience"><div className="experience-card"><div className="qr-orbit"><QrCode size={54} /><span>SCAN</span></div><p className="eyebrow">YOUR DIGITAL JOURNEY</p><h1>Chiếc hộp chỉ là<br /><em>điểm bắt đầu.</em></h1><p>Quét mã QR trên thẻ Digital Passport để mở khóa câu chuyện đầu tiên của bạn.</p><div className="button-row"><button className="button primary" onClick={() => navigate('/scan')}><Camera size={17} /> Mở camera để scan QR <ArrowRight size={17} /></button><button className="text-button" onClick={() => navigate('/experience/demo')}><QrCode size={17} /> Xem QR demo</button></div><small>Camera permission required · HTTPS hoặc localhost</small></div></main> }

function DemoQrList() {
    const navigate = useNavigate();
    return <main className="page"><div className="page-hero compact"><p className="eyebrow">QR DEMO / PASSPORT</p><h1>Danh sách QR<br /><em>để tích vào passport.</em></h1><p>Các mã dưới đây có thể quét bằng camera hoặc mở trực tiếp để thử nhanh luồng tích điểm vào Digital Passport.</p></div><section className="section-wrap"><div className="story-grid">{demoQrTokens.map(item => <article className="story-card" key={item.token}><div className="story-image"><img src={getQrCodeUrl(item.token)} alt={item.label} /></div><div className="story-card-body"><small>{item.location}</small><h3>{item.label}</h3><p>{item.description}</p><button className="button dark" onClick={() => navigate(`/experience/qr/${encodeURIComponent(item.token)}`)}>Quét mã này <ArrowRight size={17} /></button></div></article>)}</div></section></main>
}

function QRExperience() { const [done, setDone] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const { token } = useParams(); const navigate = useNavigate(); const verify = async () => { setLoading(true); setError(''); try { const response = await api.post<{ data: { valid: boolean } }>('/qr/verify', { token }); if (response.data.data.valid) setDone(true); else setError('QR code không hợp lệ hoặc đã bị vô hiệu hóa.'); } catch (requestError: any) { setError(requestError.response?.status === 401 ? 'Vui lòng đăng nhập trước khi scan QR.' : 'QR code này chưa được kích hoạt hoặc không tồn tại.'); } finally { setLoading(false); } }; return <main className="experience qr-page"><div className="journey-card">{!done ? <><div className="success-icon"><QrCode size={31} /></div><p className="eyebrow">QR VERIFICATION / CẦN THƠ #001</p><h1>Your Mekong<br /><em>journey begins.</em></h1><p>Mã QR đã sẵn sàng mở ra một câu chuyện từ chợ nổi Cái Răng.</p>{error && <><p role="alert">{error}</p>{error.includes('đăng nhập') && <Link className="under-link" to="/login">Đăng nhập để tiếp tục <ArrowRight size={15} /></Link>}</>}<button className="button dark" onClick={verify} disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác thực QR'} <Check size={17} /></button></> : <><div className="success-icon"><Check size={31} /></div><p className="eyebrow">EXPERIENCE UNLOCKED</p><h1>Chào mừng bạn<br /><em>về miền Tây.</em></h1><p>Lần khám phá đã được ghi vào Digital Passport của bạn.</p><div className="reward"><Stamp size={20} /><span>EXPERIENCE COUNTED</span><strong>+100 điểm</strong></div><button className="button dark" onClick={() => navigate('/passport')}>Mở Digital Passport <ArrowRight size={17} /></button></>}</div></main> }
function Passport() { const [passport, setPassport] = useState<{ totalPoints: number; level: number; explorationCount: number }>(); const [error, setError] = useState(false); useEffect(() => { api.get<{ data: typeof passport }>('/passport').then(response => setPassport(response.data.data)).catch(() => setError(true)) }, []); const points = passport?.totalPoints ?? 0; const count = passport?.explorationCount ?? 0; return <main className="page passport-page"><div className="passport-head section-wrap"><div><p className="eyebrow">YOUR COLLECTIBLE JOURNEY</p><h1>Digital<br /><em>Passport.</em></h1></div><div className="level-mark"><Crown size={19} /><span>LEVEL {passport?.level ?? 1}</span><strong>{count ? 'MEKONG EXPLORER' : 'READY TO EXPLORE'}</strong></div></div><section className="passport-paper section-wrap"><div className="passport-top"><span>MEKONG STORY BOX</span><span>EXPLORATIONS {count}</span></div><div className="passport-main"><div className="passport-avatar"><Compass size={42} /><small>EXPLORER</small></div><div><p className="eyebrow">{error ? 'SIGN IN TO CONTINUE' : count ? 'YOUR JOURNEY SO FAR' : 'YOUR JOURNEY STARTS HERE'}</p><h2>{count ? <>Your story<br /><em>is growing.</em></> : <>Your passport<br /><em>is waiting.</em></>}</h2><div className="points"><strong>{points.toLocaleString('vi-VN')}</strong><span>POINTS EARNED</span></div></div></div><div className="progress-label"><span>YOUR PROGRESS</span><span>{count} EXPLORATIONS</span></div><div className="progress"><span style={{ width: `${Math.min(count * 20, 100)}%` }} /></div><div className="badge-row"><div className={'passport-badge ' + (count ? 'unlocked' : 'locked')}><span>🛶</span><b>Floating Market</b><small>{count ? 'UNLOCKED' : 'LOCKED'}</small></div><div className="passport-badge locked"><span>🌿</span><b>Mekong Garden</b><small>LOCKED</small></div><div className="passport-badge locked"><span>🎵</span><b>Southern Music</b><small>LOCKED</small></div><div className="passport-badge locked"><span>🍜</span><b>Mekong Cuisine</b><small>LOCKED</small></div></div></section></main> }
function Cart({ items, updateQuantity, removeItem }: { items: CartItem[]; updateQuantity: (id: number, quantity: number) => void; removeItem: (id: number) => void }) {
    const navigate = useNavigate()
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    return <main className="page cart-page"><div className="section-wrap"><p className="eyebrow">YOUR JOURNEY / CART</p><h1>Chuẩn bị<br /><em>lên đường.</em></h1>{items.length === 0 ? <div className="cart-empty"><p>Giỏ hàng của bạn đang trống.</p><Link className="button dark" to="/products">Khám phá sản phẩm <ArrowRight size={16} /></Link></div> : <div className="cart-layout"><div className="cart-items-list">{items.map(({ product, quantity }) => <article className="cart-item" key={product.id}><img src={product.thumbnailUrl} alt={product.name} /><div className="cart-item-details"><span>{product.slug}</span><h3>{product.name}</h3><small>{money(product.price)} / sản phẩm</small><div className="quantity"><button aria-label={`Giảm số lượng ${product.name}`} onClick={() => updateQuantity(product.id, quantity - 1)}><Minus size={14} /></button><b>{quantity}</b><button aria-label={`Tăng số lượng ${product.name}`} onClick={() => updateQuantity(product.id, quantity + 1)}><Plus size={14} /></button></div></div><div className="cart-item-total"><strong>{money(product.price * quantity)}</strong><button className="icon-btn" aria-label={`Xóa ${product.name} khỏi giỏ`} onClick={() => removeItem(product.id)}><X size={16} /></button></div></article>)}</div><div className="summary"><span>TỔNG ĐƠN HÀNG</span><div><b>{items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</b><strong>{money(subtotal)}</strong></div><div><b>Vận chuyển</b><strong>Miễn phí</strong></div><hr /><div className="total"><b>Tổng cộng</b><strong>{money(subtotal)}</strong></div><button className="button dark full" onClick={() => navigate('/checkout')}>Tiến hành đặt hàng <ArrowRight size={16} /></button></div></div>}</div></main>
}
function Checkout({ isAuthenticated, hasItems, onOrderComplete }: { isAuthenticated: boolean; hasItems: boolean; onOrderComplete: (details: CheckoutDetails) => Promise<OrderResult> }) {
    const [sent, setSent] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [order, setOrder] = useState<OrderResult>()
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setSubmitting(true)
        const form = new FormData(event.currentTarget)
        try {
            const result = await onOrderComplete({
                customerName: String(form.get('customerName')),
                phone: String(form.get('phone')),
                shippingAddress: String(form.get('shippingAddress')),
            })
            setOrder(result)
            setSent(true)
        } catch (requestError: any) {
            const status = requestError.response?.status
            setError(status === 401
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đặt hàng.'
                : status === 400
                    ? 'Sản phẩm trong giỏ không còn khả dụng. Vui lòng kiểm tra lại giỏ hàng.'
                    : status === 403 || status === 404
                        ? 'Backend chưa được cập nhật chức năng đặt hàng. Hãy khởi động lại backend rồi thử lại.'
                        : 'Không thể tạo đơn hàng lúc này. Giỏ hàng của bạn vẫn được giữ nguyên.')
        } finally {
            setSubmitting(false)
        }
    }
    return <main className="page"><div className="section-wrap checkout"><p className="eyebrow">FINAL STEP / CHECKOUT</p>{sent ? <div className="order-success"><div className="success-icon"><Check /></div><h1>Đơn hàng đã<br /><em>được ghi nhận.</em></h1><p>Cảm ơn bạn đã chọn mang một phần miền Tây về nhà. Mã đơn hàng của bạn là <b>{order?.orderCode}</b>.</p><p>Đã cộng {order?.passportPointsAwarded} điểm và 1 lượt vào Digital Passport.</p><Link className="button dark" to="/passport">Mở Digital Passport <ArrowRight size={16} /></Link></div> : <><h1>Đưa câu chuyện<br /><em>về nhà.</em></h1>{!isAuthenticated && <p role="alert">Đăng nhập để đặt hàng và ghi nhận vào Digital Passport. <Link to="/login" state={{ from: '/checkout' }}>Đăng nhập</Link></p>}{!hasItems && <p role="alert">Giỏ hàng đang trống. <Link to="/products">Chọn sản phẩm</Link></p>}{error && <p role="alert">{error}</p>}<form onSubmit={submit}><label>HỌ VÀ TÊN<input name="customerName" required maxLength={150} placeholder="Nguyễn Minh Linh" /></label><label>SỐ ĐIỆN THOẠI<input name="phone" required maxLength={50} placeholder="09xx xxx xxx" /></label><label>ĐỊA CHỈ NHẬN HÀNG<textarea name="shippingAddress" required maxLength={1000} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" /></label><button className="button dark" type="submit" disabled={!isAuthenticated || !hasItems || submitting}>{submitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'} <ArrowRight size={16} /></button></form></>}</div></main>
}
function About() { return <main className="page about"><div className="page-hero compact"><p className="eyebrow">OUR WHY</p><h1>Có một miền Tây<br /><em>luôn ở trong tim.</em></h1><p>Chúng tôi kể những câu chuyện văn hóa bằng ngôn ngữ của thế hệ hôm nay.</p></div><div className="section-wrap about-copy"><p className="large-copy">Mekong Story Box được bắt đầu bởi những người trẻ lớn lên bên dòng sông, nhưng đôi khi quên mất cách lắng nghe nó.</p><p>Chúng tôi tin rằng văn hóa không nằm yên trong bảo tàng. Văn hóa ở trong tiếng máy ghe lúc 5 giờ sáng, trong vị ngọt của trái dừa, trong những bàn tay khéo léo và trong cách một câu chuyện được truyền từ người này sang người khác.</p></div></main> }
function AuthPage({ mode, onAuthenticated }: { mode: 'login' | 'register'; onAuthenticated: (user: AuthUser) => void }) {
    const navigate = useNavigate()
    const location = useLocation()
    const returnTo = (location.state as { from?: string } | null)?.from ?? '/'
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        const form = new FormData(event.currentTarget)
        try {
            const user = mode === 'login'
                ? await login(String(form.get('email')), String(form.get('password')))
                : await register(String(form.get('fullName')), String(form.get('email')), String(form.get('password')))
            onAuthenticated(user)
            navigate(returnTo)
        } catch {
            setError(mode === 'login' ? 'Email hoặc mật khẩu không đúng.' : 'Không thể tạo tài khoản. Email có thể đã được sử dụng.')
        } finally {
            setLoading(false)
        }
    }
    return <main className="page auth-page"><div className="auth-card"><p className="eyebrow">MEKONG STORY BOX / ACCOUNT</p><h1>{mode === 'login' ? <>Chào mừng<br /><em>trở lại.</em></> : <>Bắt đầu<br /><em>hành trình.</em></>}</h1><form onSubmit={submit}>{mode === 'register' && <label>HỌ VÀ TÊN<input name="fullName" required maxLength={150} placeholder="Nguyễn Minh Linh" /></label>}<label>EMAIL<input name="email" type="email" required placeholder="you@example.com" /></label><label>MẬT KHẨU<input name="password" type="password" required minLength={8} placeholder="Tối thiểu 8 ký tự" /></label>{error && <p role="alert">{error}</p>}<button className="button dark" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} <ArrowRight size={16} /></button></form><p className="auth-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <Link to={mode === 'login' ? '/register' : '/login'} state={{ from: returnTo }}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</Link></p></div></main>
}
function Admin() {
    const navigate = useNavigate()
    const [tab, setTab] = useState<'product' | 'story' | 'qr'>('product')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [createdToken, setCreatedToken] = useState('')
    const [overview, setOverview] = useState({ products: 0, stories: 0, qrTokens: 0, activeQrTokens: 0 })
    useEffect(() => { api.get<typeof overview>('/admin/overview').then(response => setOverview(response.data)).catch(() => setError('Tài khoản hiện tại không có quyền quản trị.')) }, [])
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setMessage(''); setError('')
        const formElement = event.currentTarget
        const form = new FormData(formElement)
        const payload = Object.fromEntries(form.entries())
        if (tab === 'product') payload.price = Number(payload.price) as unknown as string
        if (tab === 'product') payload.thumbnailUrl = String(payload.thumbnailUrl || '')
        if (tab === 'story') payload.readingTime = Number(payload.readingTime) as unknown as string
        if (tab === 'qr') payload.productId = Number(payload.productId) as unknown as string
        const endpoint = tab === 'product' ? '/admin/products' : tab === 'story' ? '/admin/stories' : '/admin/qr-tokens'
        try { await api.post(endpoint, payload); setCreatedToken(tab === 'qr' ? String(payload.token) : ''); setMessage(tab === 'qr' ? 'Mã QR đã được tạo và liên kết với sản phẩm.' : tab === 'product' ? 'Sản phẩm mới đã được tạo.' : 'Story mới đã được tạo.'); formElement.reset(); api.get<typeof overview>('/admin/overview').then(response => setOverview(response.data)) } catch (requestError: any) { const status = requestError.response?.status; const serverMessage = requestError.response?.data?.message || requestError.response?.data?.detail; setError(status === 403 ? 'Tài khoản chưa có quyền ADMIN.' : status === 404 ? 'Không tìm thấy API tạo nội dung. Hãy khởi động lại backend.' : status === 409 ? String(serverMessage || (tab === 'qr' ? 'Mã QR đã tồn tại, hãy chọn token khác.' : 'Slug đã tồn tại, hãy chọn slug khác.')) : status === 400 ? String(serverMessage || (tab === 'qr' ? 'ID sản phẩm không tồn tại.' : 'Dữ liệu chưa đúng định dạng. Kiểm tra các trường bắt buộc.')) : String(serverMessage || 'Không thể kết nối tới máy chủ.')) }
    }
    return <main className="page admin"><div className="section-wrap"><div className="admin-heading"><div><p className="eyebrow"><ShieldCheck size={14} /> ADMIN / CONTROL ROOM</p><h1>Build the<br /><em>journey.</em></h1><p>Quản lý nội dung, sản phẩm và mã QR dùng để mở khóa Digital Passport.</p></div><span className="admin-status">LIVE SYSTEM</span></div><div className="metric-grid">{[[overview.products, 'PRODUCTS'], [overview.stories, 'STORIES'], [overview.qrTokens, 'QR TOKENS'], [overview.activeQrTokens, 'ACTIVE CODES']].map(([value, label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span><small>Đang đồng bộ hệ thống</small></div>)}</div><section className="admin-workspace"><aside className="admin-sidebar"><span>CREATE CONTENT</span><button className={tab === 'product' ? 'selected' : ''} onClick={() => setTab('product')}><Package size={17} /> Sản phẩm</button><button className={tab === 'story' ? 'selected' : ''} onClick={() => setTab('story')}><FileText size={17} /> Story</button><button className={tab === 'qr' ? 'selected' : ''} onClick={() => setTab('qr')}><QrCode size={17} /> Mã QR</button></aside><div className="admin-form-area"><div className="admin-form-heading"><div><span className="number-label">{tab === 'product' ? '01 / PRODUCT' : tab === 'story' ? '02 / STORY' : '03 / PASSPORT ACCESS'}</span><h2>{tab === 'product' ? 'Tạo sản phẩm mới' : tab === 'story' ? 'Kể một câu chuyện' : 'Phát hành mã QR'}</h2></div><Plus size={20} /></div>{message && <p className="admin-message success" role="status">{message}</p>}{error && <p className="admin-message error" role="alert">{error}</p>}<form className="admin-form" onSubmit={submit}>{tab === 'product' && <><label>TÊN SẢN PHẨM<input name="name" required placeholder="Mekong Story Box — Bến Tre #002" /></label><div className="form-pair"><label>SLUG<input name="slug" required placeholder="ben-tre-002" /></label><label>GIÁ BÁN<input name="price" type="number" min="1" required placeholder="299000" /></label></div><label>MÔ TẢ<textarea name="description" placeholder="Câu chuyện và nội dung trong hộp" /></label><label>ẢNH THUMBNAIL<input name="thumbnailUrl" type="url" placeholder="https://..." /></label></>}{tab === 'story' && <><label>TIÊU ĐỀ STORY<input name="title" required placeholder="Mùi dừa trong gió sông" /></label><div className="form-pair"><label>SLUG<input name="slug" required placeholder="mui-dua-trong-gio-song" /></label><label>THỜI GIAN ĐỌC<input name="readingTime" type="number" min="1" required placeholder="5" /></label></div><label>DANH MỤC<input name="category" required placeholder="PEOPLE / PLACES / FOOD" /></label><label>TÓM TẮT<textarea name="summary" placeholder="Một đoạn giới thiệu ngắn cho story" /></label><label>ẢNH COVER<input name="coverImage" type="url" placeholder="https://..." /></label></>}{tab === 'qr' && <><label>MÃ TOKEN<input name="token" required placeholder="ben-tre-market-002" /></label><label>ID SẢN PHẨM<input name="productId" type="number" min="1" required placeholder="1" /></label><div className="qr-admin-note"><QrCode size={22} /><div><strong>Chỉ scan mới cộng điểm</strong><p>Mua hàng không mở khóa passport. Mã này sẽ được in lên thẻ hoặc bao bì sản phẩm.</p></div></div></>}<button className="button dark" type="submit">{tab === 'qr' ? 'Tạo mã QR' : tab === 'product' ? 'Lưu sản phẩm' : 'Lưu story'} <ArrowRight size={16} /></button></form></div></section></div></main>
}

function AdminDashboard() {
    return <main className="page admin admin-dashboard-page"><div className="admin-layout"><AdminSidebar active="dashboard" /><div className="admin-main"><Admin /></div></div></main>
}

function AdminRoute({ ready, view }: { ready: boolean; view?: 'products' | 'stories' | 'qr' | 'orders' }) {
    const [allowed, setAllowed] = useState<boolean>()
    useEffect(() => {
        if (!ready) return
        api.get('/admin/overview').then(() => setAllowed(true)).catch(() => setAllowed(false))
    }, [ready])
    if (!ready || allowed === undefined) return null
    if (!allowed) return <Navigate to="/" replace />
    if (view === 'orders') return <AdminOrders />
    return view ? <AdminManagement mode={view} /> : <AdminDashboard />
}

export default function App() {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [user, setUser] = useState<AuthUser>()
    const [authReady, setAuthReady] = useState(false)
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    useEffect(() => {
        if (!localStorage.getItem('mekong_access_token')) { setAuthReady(true); return }
        currentUser().then(setUser).catch(() => { localStorage.removeItem('mekong_access_token') }).finally(() => setAuthReady(true))
    }, [])
    const addToCart = (product: Product) => setCartItems(items => {
        const existing = items.find(item => item.product.id === product.id)
        return existing
            ? items.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            : [...items, { product, quantity: 1 }]
    })
    const updateCartQuantity = (id: number, quantity: number) => setCartItems(items => quantity < 1
        ? items.filter(item => item.product.id !== id)
        : items.map(item => item.product.id === id ? { ...item, quantity } : item))
    const removeFromCart = (id: number) => setCartItems(items => items.filter(item => item.product.id !== id))
    const placeOrder = async (details: CheckoutDetails) => {
        const response = await api.post<{ data: OrderResult }>('/orders', {
            ...details,
            items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        })
        setCartItems([])
        return response.data.data
    }
    const handleLogout = () => logout().then(() => setUser(undefined))
    return <Shell cartCount={cartCount} user={user} onLogout={handleLogout}><Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/products" element={<StoryBox addToCart={addToCart} />} />
        <Route path="/story-box" element={<StoryBox addToCart={addToCart} />} />
        <Route path="/stories" element={<Stories />} /><Route path="/stories/:id" element={<Stories />} />
        <Route path="/experience" element={<Experience />} /><Route path="/experience/demo" element={<DemoQrList />} />
        <Route path="/scan" element={<QrScanner />} /><Route path="/experience/qr/:token" element={<QRExperience />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/cart" element={<Cart items={cartItems} updateQuantity={updateCartQuantity} removeItem={removeFromCart} />} />
        <Route path="/checkout" element={<Checkout isAuthenticated={Boolean(user)} hasItems={cartItems.length > 0} onOrderComplete={placeOrder} />} /><Route path="/about" element={<About />} />
        <Route path="/login" element={<AuthPage mode="login" onAuthenticated={setUser} />} />
        <Route path="/register" element={<AuthPage mode="register" onAuthenticated={setUser} />} />
        <Route path="/admin" element={<AdminRoute ready={authReady} />} />
        <Route path="/admin/products" element={<AdminRoute ready={authReady} view="products" />} />
        <Route path="/admin/stories" element={<AdminRoute ready={authReady} view="stories" />} />
        <Route path="/admin/qr-tokens" element={<AdminRoute ready={authReady} view="qr" />} />
        <Route path="/admin/orders" element={<AdminRoute ready={authReady} view="orders" />} />
    </Routes></Shell>
}
