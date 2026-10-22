import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Camera, Check, Compass, Cookie, FileText, Gift, Globe, Heart, Leaf, Lock, Mail, Map as MapIcon, MapPin, Menu, Minus, Package, Palmtree, Plus, QrCode, ShieldCheck, ShoppingBag, Stamp, Sun, X } from 'lucide-react'
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
type PaymentMethod = 'PREPAID_QR' | 'COD'
type CheckoutDetails = { customerName: string; phone: string; shippingAddress: string; paymentMethod: PaymentMethod }
type OrderResult = { id: number; orderCode: string; totalAmount: number; passportPointsAwarded: number; paymentMethod: PaymentMethod; paymentStatus: string }
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
const provinces = ['Cần Thơ', 'Bến Tre', 'Vĩnh Long', 'An Giang', 'Đồng Tháp', 'Sóc Trăng', 'Tiền Giang', 'Cà Mau', 'Bạc Liêu', 'Kiên Giang', 'Trà Vinh', 'Hậu Giang', 'Long An']
const boxContents: [typeof Mail, string, string][] = [
    [Mail, 'Postcard Cần Thơ', 'Bưu thiếp vẽ tay chợ nổi Cái Răng lúc bình minh.'],
    [MapIcon, 'Bản đồ sông nước', 'Tấm bản đồ in giấy dó dẫn lối qua những con kênh.'],
    [Cookie, 'Đặc sản địa phương', 'Kẹo dừa, bánh pía, mứt — vị ngọt của miệt vườn.'],
    [Palmtree, 'Đồ thủ công', 'Món quà đan lục bình, tre, dừa từ làng nghề.'],
    [BookOpen, 'Thẻ câu chuyện', 'Một mẩu ký ức từ người làm ra món quà.'],
    [Stamp, 'Digital Passport', 'Quét mã, đóng dấu, tích điểm cho mỗi chuyến đi.'],
]
const journeySteps: [string, string, string, typeof Package][] = [
    ['01', 'Mở hộp', 'Chạm vào hương vị đất phù sa, mùi lá dừa và giấy dó.', Package],
    ['02', 'Quét mã', 'Bước vào không gian số của người làm ra món quà.', QrCode],
    ['03', 'Đóng dấu', 'Mỗi lần khám phá là một con dấu trong Digital Passport.', Stamp],
    ['04', 'Đổi quà', 'Tích đủ 500 điểm, đổi lấy một Story Box mới.', Gift],
]
function Wave({ className = '' }: { className?: string }) {
    return <svg className={'wave ' + className} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 C 180 10 360 90 540 50 S 900 10 1080 50 S 1320 85 1440 45 V90 H0 Z" /></svg>
}
function Shell({ children, cartCount, user, onLogout }: { children: React.ReactNode; cartCount: number; user?: AuthUser; onLogout: () => void }) {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [location.pathname])
    useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll) }, [])
    if (location.pathname.startsWith('/admin')) return <div className="admin-app-shell">{children}</div>
    const onHome = location.pathname === '/'
    const isActive = (...paths: string[]) => paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/')) ? 'active' : ''
    return <div className={'app-shell' + (onHome ? ' on-home' : '')}>
        <header className={'topbar' + (scrolled || !onHome || open ? ' solid' : '')}>
            <Link to="/" className="brand"><span className="brand-mark"><Sun size={18} /></span><span>MEKONG<b>Story Box</b></span></Link>
            <nav className={open ? 'nav open' : 'nav'}>
                <Link className={onHome ? 'active' : ''} to="/">Trang chủ</Link>
                <Link className={isActive('/products', '/story-box')} to="/products">Story Box</Link>
                <Link className={isActive('/stories')} to="/stories">Câu chuyện</Link>
                <Link className={isActive('/passport')} to="/passport">Passport</Link>
                {user && <Link className={isActive('/orders')} to="/orders">Đơn hàng</Link>}
                <Link className={isActive('/about')} to="/about">Về chúng tôi</Link>
            </nav>
            <div className="header-actions">
                <Link className="icon-btn scan-link" aria-label="Quét QR" to="/experience"><QrCode size={18} /></Link>
                {user?.roles?.includes('ADMIN') && <Link className="user-action admin-link" to="/admin">Dashboard</Link>}
                {user ? <button className="user-action" onClick={onLogout}>{user.fullName} · Thoát</button> : <Link className="user-action" to="/login">Đăng nhập</Link>}
                <Link aria-label="Giỏ hàng" className="icon-btn cart-link" to="/cart"><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</Link>
                <button className="menu-btn" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
            </div>
        </header>
        {children}
        <footer>
            <Wave className="footer-wave" />
            <div className="footer-inner">
                <div><Link className="brand footer-brand" to="/"><span className="brand-mark"><Sun size={18} /></span><span>MEKONG<b>Story Box</b></span></Link><p className="footer-tagline">Một chuyến về miền Tây,<br /><em>nằm trong một chiếc hộp.</em></p></div>
                <div><strong>Khám phá</strong><Link to="/products">Story Box</Link><Link to="/stories">Câu chuyện</Link><Link to="/passport">Digital Passport</Link><Link to="/experience">Quét mã QR</Link></div>
                <div><strong>Bến đỗ</strong><p><MapPin size={15} /> Đại học FPT Cần Thơ</p><p><Mail size={15} /> hello@mekongstorybox.vn</p></div>
                <div><strong>Theo dòng sông</strong><p className="social"><a href="#" aria-label="Website"><Globe size={17} /></a><a href="#" aria-label="Email"><Mail size={17} /></a></p></div>
            </div>
            <div className="footer-bottom"><small>© 2026 Mekong Story Box</small><small>Làm bằng thương nhớ ở đồng bằng sông Cửu Long</small></div>
        </footer>
    </div>
}

const fadeInUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } } }
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }
const reveal = { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-80px' }, variants: stagger } as const

const fallingLeaves = [
    { left: '58%', delay: 0.8, duration: 9, drift: [0, 50, -20, 60, 20], spin: [-20, 25, -10, 40, 15], colors: ['#7fae4a', '#3f7a2e'] },
    { left: '80%', delay: 2.6, duration: 10.5, drift: [0, -45, 25, -35, -10], spin: [30, -15, 35, -5, 50], colors: ['#f0b24a', '#c9782b'] },
]
function FallingLeaves() {
    return <div className="falling-leaves" aria-hidden="true">
        {fallingLeaves.map((leaf, index) => <motion.svg key={index} className="falling-leaf" style={{ left: leaf.left }} viewBox="0 0 40 64" width="34" height="54"
            initial={{ y: '-12vh', opacity: 0 }}
            animate={{ y: ['-12vh', '96vh'], x: leaf.drift, rotate: leaf.spin, scaleX: [1, 0.45, 1, 0.55, 1], opacity: [0, 1, 1, 1, 0] }}
            transition={{ delay: leaf.delay, duration: leaf.duration, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }}>
            <defs><linearGradient id={`leaf-${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={leaf.colors[0]} /><stop offset="1" stopColor={leaf.colors[1]} /></linearGradient></defs>
            <path d="M20 2 C 36 16 38 40 20 60 C 2 40 4 16 20 2 Z" fill={`url(#leaf-${index})`} />
            <path d="M20 6 V 62 M20 22 L 29 15 M20 32 L 31 24 M20 42 L 29 36 M20 22 L 11 15 M20 32 L 9 24 M20 42 L 11 36" stroke="rgba(255,255,255,.45)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </motion.svg>)}
    </div>
}

function Home({ addToCart }: { addToCart: (product: Product) => void }) {
    const navigate = useNavigate(); const [stories, setStories] = useState<Story[]>([]); const [product, setProduct] = useState<Product>()
    useEffect(() => { getStories().then(setStories).catch(() => setStories([])); getProduct().then(setProduct).catch(() => undefined) }, [])

    return <main className="mekong-home">
        <section className="mekong-hero">
            <motion.img className="hero-bg" src="/mekong_hero.png" alt="" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: 'easeOut' }} />
            <div className="hero-shade" />
            <FallingLeaves />
            <motion.div initial="hidden" animate="visible" variants={stagger} className="hero-content">
                <motion.p variants={fadeInUp} className="hero-eyebrow"><Sun size={15} /> Đồng bằng sông Cửu Long</motion.p>
                <motion.h1 variants={fadeInUp} className="hero-title">Một chuyến về miền Tây,<br /><em>nằm trong một chiếc hộp.</em></motion.h1>
                <motion.p variants={fadeInUp} className="hero-subtitle">Mở nắp hộp, nghe tiếng ghe máy lúc năm giờ sáng, nếm vị ngọt kẹo dừa và mang theo câu chuyện của những người sống bên dòng Cửu Long.</motion.p>
                <motion.div variants={fadeInUp} className="hero-actions">
                    <button className="btn-mekong" onClick={() => navigate('/story-box')}>Chọn Story Box <ArrowRight size={18} /></button>
                    <button className="btn-mekong-outline" onClick={() => navigate('/experience')}><QrCode size={18} /> Quét mã trải nghiệm</button>
                </motion.div>
            </motion.div>
            <motion.div className="hero-ticket" initial={{ opacity: 0, rotate: 8, y: 30 }} animate={{ opacity: 1, rotate: 4, y: 0 }} transition={{ delay: 0.9, duration: 0.9 }}>
                <span>VÉ ĐÒ / BOARDING</span><strong>CẦN THƠ<br />#001</strong><small>Chợ nổi Cái Răng · 05:00</small>
            </motion.div>
            <Wave className="hero-wave" />
        </section>

        <div className="province-ticker" aria-hidden="true"><div>{[...provinces, ...provinces].map((name, index) => <span key={index}>{name}<i>✦</i></span>)}</div></div>

        <section className="mekong-inbox section-wrap">
            <motion.div {...reveal} className="section-heading">
                <motion.span variants={fadeInUp} className="mekong-label">01 · Trong hộp có gì</motion.span>
                <motion.h2 variants={fadeInUp}>Sáu món quà,<br /><em>một miền sông nước.</em></motion.h2>
                <motion.p variants={fadeInUp}>Mỗi Story Box là một chuyến du lịch thu nhỏ — được gói ghém bởi những người trẻ lớn lên bên bờ kênh.</motion.p>
            </motion.div>
            <motion.div {...reveal} className="inbox-grid">
                {boxContents.map(([Icon, title, text], index) => <motion.article variants={fadeInUp} className="inbox-item" key={title}><span className="inbox-index">0{index + 1}</span><Icon size={26} /><h3>{title}</h3><p>{text}</p></motion.article>)}
            </motion.div>
        </section>

        <section className="mekong-journey">
            <Wave className="journey-wave-top" />
            <div className="section-wrap">
                <motion.div {...reveal} className="journey-header">
                    <motion.span variants={fadeInUp} className="mekong-label light">02 · Xuôi dòng trải nghiệm</motion.span>
                    <motion.h2 variants={fadeInUp}>Không chỉ là quà tặng.<br /><em>Đó là một chuyến đò.</em></motion.h2>
                </motion.div>
                <motion.div {...reveal} className="journey-steps">
                    {journeySteps.map(([n, t, d, Icon]) => <motion.div variants={fadeInUp} className="journey-step" key={n}><div className="journey-dot"><Icon size={20} /></div><strong>{n}</strong><h3>{t}</h3><p>{d}</p></motion.div>)}
                </motion.div>
            </div>
            <Wave className="journey-wave" />
        </section>

        <section className="mekong-featured section-wrap">
            <motion.div {...reveal} className="featured-wrapper">
                <motion.div variants={fadeInUp} className="featured-image">
                    <img src={product?.thumbnailUrl || '/storybox_product.png'} alt={product?.name ?? 'Mekong Story Box'} onError={event => { event.currentTarget.src = '/storybox_product.png' }} />
                    <div className="featured-stamp"><span>MEKONG</span><strong>#001</strong><span>CẦN THƠ</span></div>
                </motion.div>
                <motion.div variants={stagger} className="featured-content">
                    <motion.span variants={fadeInUp} className="mekong-label">03 · Hộp nổi bật</motion.span>
                    <motion.h2 variants={fadeInUp}>{product?.name ?? 'Mekong Story Box — Cần Thơ #001'}</motion.h2>
                    <motion.p variants={fadeInUp}>{product?.description || 'Hộp tre đan thủ công, bên trong là trà trái cây miệt vườn, kẹo dừa Bến Tre, hạt sen vàng và thẻ Digital Passport.'}</motion.p>
                    <motion.ul variants={fadeInUp} className="featured-list"><li><Leaf size={16} /> Bao bì tre, lục bình tái chế</li><li><Heart size={16} /> Sản phẩm từ hộ làm nghề địa phương</li><li><Stamp size={16} /> Tích điểm Passport với mỗi hộp</li></motion.ul>
                    <motion.div variants={fadeInUp} className="featured-price">
                        {product && <strong>{money(product.price)}</strong>}
                        <span>6 món quà · 1 hành trình</span>
                    </motion.div>
                    <motion.div variants={fadeInUp} className="featured-actions">
                        {product ? <button className="btn-mekong" onClick={() => addToCart(product)}>Thêm vào giỏ <ShoppingBag size={18} /></button> : <button className="btn-mekong" onClick={() => navigate('/products')}>Xem bộ sưu tập <ArrowRight size={18} /></button>}
                        <Link to="/story-box" className="link-mekong">Tất cả Story Box <ArrowRight size={18} /></Link>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>

        <section className="mekong-map section-wrap">
            <motion.div {...reveal} className="map-card">
                <motion.div variants={fadeInUp} className="map-copy">
                    <span className="mekong-label light">04 · Bản đồ hành trình</span>
                    <h2>Mười ba tỉnh thành,<br /><em>mười ba chiếc hộp.</em></h2>
                    <p>Mỗi mùa, chúng tôi xuôi về một bến sông mới. Cần Thơ là chuyến đầu tiên — những chuyến kế tiếp đang được chuẩn bị.</p>
                </motion.div>
                <motion.div variants={fadeInUp} className="map-chips">
                    {provinces.map((name, index) => <span className={index === 0 ? 'open' : index < 3 ? 'soon' : ''} key={name}><MapPin size={13} /> {name}<small>{index === 0 ? 'Đang mở' : index < 3 ? 'Sắp cập bến' : `#${String(index + 1).padStart(3, '0')}`}</small></span>)}
                </motion.div>
            </motion.div>
        </section>

        <section className="mekong-stories section-wrap">
            <motion.div {...reveal} className="stories-header">
                <div>
                    <motion.span variants={fadeInUp} className="mekong-label">05 · Chuyện bên bờ</motion.span>
                    <motion.h2 variants={fadeInUp}>Những mẩu chuyện<br /><em>dọc đôi bờ sông.</em></motion.h2>
                </div>
                <motion.div variants={fadeInUp}><Link to="/stories" className="link-mekong">Tất cả câu chuyện <ArrowRight size={18} /></Link></motion.div>
            </motion.div>
            <motion.div {...reveal} className="mekong-stories-grid">
                {stories.slice(0, 3).map(story => <motion.div variants={fadeInUp} key={story.id}><StoryCard story={story} /></motion.div>)}
            </motion.div>
            {stories.length === 0 && <p className="muted-note">Những câu chuyện đang trên đường về bến…</p>}
        </section>

        <section className="passport-cta section-wrap">
            <div className="passport-cta-card">
                <div><span className="mekong-label light">Digital Passport</span><h2>Mỗi con dấu<br /><em>là một bến sông.</em></h2><p>Quét mã QR trong hộp để mở khóa câu chuyện, nhận điểm và sưu tầm huy hiệu Chợ nổi, Miệt vườn, Đờn ca tài tử…</p></div>
                <div className="passport-cta-actions"><button className="btn-mekong" onClick={() => navigate('/passport')}>Mở Passport <Compass size={18} /></button><button className="btn-mekong-outline" onClick={() => navigate('/experience/demo')}>Thử QR demo</button></div>
            </div>
        </section>
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
const POINTS_PER_LEVEL = 500
const passportStamps = [
    { icon: '🛶', name: 'Chợ nổi', place: 'Cái Răng · Cần Thơ', color: 'sun' },
    { icon: '🥥', name: 'Xứ dừa', place: 'Mỏ Cày · Bến Tre', color: 'leaf' },
    { icon: '🌿', name: 'Miệt vườn', place: 'Cù lao An Bình · Vĩnh Long', color: 'river' },
    { icon: '🎵', name: 'Đờn ca tài tử', place: 'Bạc Liêu', color: 'lotus' },
    { icon: '🪷', name: 'Đồng sen', place: 'Tháp Mười · Đồng Tháp', color: 'lotus' },
    { icon: '🍜', name: 'Hủ tiếu', place: 'Mỹ Tho · Tiền Giang', color: 'sun' },
    { icon: '⛰️', name: 'Thất Sơn', place: 'Tri Tôn · An Giang', color: 'river' },
    { icon: '🌅', name: 'Mũi Cà Mau', place: 'Đất Mũi · Cà Mau', color: 'leaf' },
]
const passportRanks = ['Khách đò', 'Người miệt vườn', 'Bạn ghe', 'Lái ghe', 'Chủ ghe', 'Người giữ chuyện']
const rankOf = (level: number) => passportRanks[Math.min(Math.max(level, 1), passportRanks.length) - 1]
const mrzName = (name?: string) => (name ?? 'MEKONG EXPLORER').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D').toUpperCase().replace(/[^A-Z]+/g, '<')

function Passport({ user }: { user?: AuthUser }) {
    const navigate = useNavigate()
    const [passport, setPassport] = useState<{ totalPoints: number; level: number; explorationCount: number }>()
    const [error, setError] = useState(false)
    useEffect(() => {
        api.get<{ data: typeof passport }>('/passport')
            .then(response => setPassport(response.data.data))
            .catch(() => setError(true))
    }, [])
    const points = passport?.totalPoints ?? 0
    const count = passport?.explorationCount ?? 0
    const level = passport?.level ?? 1
    const progress = (points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100
    const handleRedeemed = () => setPassport(current => current ? {
        ...current,
        totalPoints: current.totalPoints - POINTS_PER_LEVEL,
        level: Math.max(1, Math.floor((current.totalPoints - POINTS_PER_LEVEL) / POINTS_PER_LEVEL) + 1),
    } : current)
    const holder = user?.fullName ?? 'Lữ khách miền Tây'
    const passportNo = `MSB${String(user?.id ?? 0).padStart(6, '0')}`

    return <main className="page passport-page">
        <section className="pp-hero">
            <div className="section-wrap pp-hero-inner">
                <div>
                    <p className="eyebrow">Hộ chiếu sông nước</p>
                    <h1>Digital<br /><em>Passport.</em></h1>
                    <p>Mỗi chiếc hộp là một bến đỗ. Quét mã QR để đóng dấu, tích điểm và lên hạng trên hải trình Cửu Long.</p>
                </div>
                <div className="pp-hero-actions">
                    <button className="button dark" onClick={() => navigate('/scan')}><Camera size={17} /> Quét QR đóng dấu</button>
                    <Link className="link-mekong" to="/experience/demo">Xem QR demo <ArrowRight size={16} /></Link>
                </div>
            </div>
        </section>

        {error && <div className="section-wrap"><p className="pp-signin" role="alert">Bạn chưa đăng nhập — hộ chiếu đang để trống. <Link to="/login" state={{ from: '/passport' }}>Đăng nhập để mở hộ chiếu</Link></p></div>}

        <section className="section-wrap">
            <div className="pp-book">
                <div className="pp-page pp-identity">
                    <div className="pp-page-head"><span>CỘNG ĐỒNG MEKONG STORY BOX</span><span>HỘ CHIẾU · PASSPORT</span></div>
                    <div className="pp-id-body">
                        <div className="pp-photo"><Compass size={46} /><small>{rankOf(level)}</small></div>
                        <dl className="pp-fields">
                            <div><dt>Họ và tên / Name</dt><dd>{holder}</dd></div>
                            <div><dt>Số hộ chiếu / No.</dt><dd>{passportNo}</dd></div>
                            <div><dt>Hạng / Rank</dt><dd>{rankOf(level)} · Lv.{level}</dd></div>
                            <div><dt>Nơi cấp / Issued at</dt><dd>Cần Thơ</dd></div>
                        </dl>
                    </div>
                    <div className="pp-points">
                        <div><strong>{points.toLocaleString('vi-VN')}</strong><span>điểm hiện có</span></div>
                        <div><strong>{count}</strong><span>lần khám phá</span></div>
                        <div><strong>{Math.floor(points / POINTS_PER_LEVEL)}</strong><span>lượt đổi quà</span></div>
                    </div>
                    <div className="pp-level">
                        <div className="pp-level-label"><span>Lv.{level} · {rankOf(level)}</span><span>{POINTS_PER_LEVEL - points % POINTS_PER_LEVEL} điểm nữa tới Lv.{level + 1}</span></div>
                        <div className="pp-level-track"><span style={{ width: `${progress}%` }} /><i style={{ left: `${progress}%` }}>🛶</i></div>
                    </div>
                    <p className="pp-mrz" aria-hidden="true">P&lt;VNM{mrzName(holder)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />{passportNo}&lt;{String(points).padStart(6, '0')}&lt;MEKONG&lt;STORY&lt;BOX&lt;&lt;&lt;{level}</p>
                </div>

                <div className="pp-page pp-stamps">
                    <div className="pp-page-head"><span>THỊ THỰC · VISAS</span><span>{Math.min(count, passportStamps.length)}/{passportStamps.length} CON DẤU</span></div>
                    <div className="pp-stamp-grid">
                        {passportStamps.map((stamp, index) => {
                            const unlocked = count > index
                            return <div className={`pp-stamp ${unlocked ? 'unlocked ' + stamp.color : 'locked'}`} style={{ ['--tilt' as string]: `${(index % 3 - 1) * 7}deg` }} key={stamp.name}>
                                <span className="pp-stamp-icon">{unlocked ? stamp.icon : <Lock size={18} />}</span>
                                <b>{stamp.name}</b>
                                <small>{unlocked ? stamp.place : 'Chưa cập bến'}</small>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </section>

        <section className="section-wrap pp-earn">
            <div className="pp-earn-item"><QrCode size={22} /><div><b>Quét QR trong hộp</b><span>+100 điểm · đóng một con dấu</span></div></div>
            <div className="pp-earn-item"><Package size={22} /><div><b>Nhận Story Box</b><span>+100 điểm khi xác nhận đã nhận hàng</span></div></div>
            <div className="pp-earn-item"><Gift size={22} /><div><b>Đổi quà</b><span>500 điểm = 1 Story Box miễn phí</span></div></div>
        </section>

        <PassportRewards points={points} authenticated={!error && Boolean(passport)} onRedeemed={handleRedeemed} />
    </main>
}

function PassportRewards({ points, authenticated, onRedeemed }: { points: number; authenticated: boolean; onRedeemed: () => void }) {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product>()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    useEffect(() => {
        api.get<{ data: Product[] }>('/products/redeemable').then(response => setProducts(response.data.data)).catch(() => setError('Không thể tải sản phẩm đổi quà.')).finally(() => setLoading(false))
    }, [])
    const redeem = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedProduct) return
        setSubmitting(true)
        setError('')
        const form = new FormData(event.currentTarget)
        try {
            const response = await api.post<{ data: { orderCode: string } }>('/passport/redemptions', {
                productId: selectedProduct.id,
                customerName: String(form.get('customerName')),
                phone: String(form.get('phone')),
                shippingAddress: String(form.get('shippingAddress')),
            })
            onRedeemed()
            setSuccess(`Đổi quà thành công. Mã đơn ${response.data.data.orderCode}. Đơn đã có trong mục Đơn hàng.`)
            setSelectedProduct(undefined)
        } catch (requestError: any) {
            const status = requestError.response?.status
            setError(status === 409 ? 'Số điểm hiện tại chưa đủ 500 để đổi quà.' : status === 401
                ? 'Vui lòng đăng nhập để sử dụng điểm Passport.'
                : status === 404 ? 'Backend chưa được cập nhật chức năng đổi quà.' : 'Không thể đổi quà lúc này. Điểm của bạn chưa bị trừ.')
        } finally {
            setSubmitting(false)
        }
    }
    const canRedeem = authenticated && points >= POINTS_PER_LEVEL
    return <section className="section-wrap passport-rewards">
        <div className="passport-rewards-heading">
            <div><p className="eyebrow"><Gift size={15} /> Chợ đổi quà</p><h2>Đổi con dấu<br /><em>lấy một chuyến đi mới.</em></h2><p>Mỗi 500 điểm đổi được một Story Box bất kỳ — miễn phí sản phẩm và giao hàng tận nhà.</p></div>
            <div className="reward-balance"><span>SỐ DƯ</span><strong>{points.toLocaleString('vi-VN')}</strong><small>{canRedeem ? `Đủ cho ${Math.floor(points / POINTS_PER_LEVEL)} lượt đổi` : `Còn thiếu ${(POINTS_PER_LEVEL - points % POINTS_PER_LEVEL).toLocaleString('vi-VN')} điểm`}</small></div>
        </div>
        {success && <p className="reward-feedback success" role="status">{success} <Link to="/orders">Theo dõi đơn hàng <ArrowRight size={14} /></Link></p>}
        {error && !selectedProduct && <p className="reward-feedback error" role="alert">{error}</p>}
        {loading ? <p role="status">Đang tải sản phẩm...</p> : <div className="reward-product-grid">{products.map(product => <article className={'reward-product' + (canRedeem ? '' : ' dimmed')} key={product.id}>
            <div className="reward-product-image"><img src={product.thumbnailUrl} alt={product.name} /><span className="reward-cost">500 điểm</span></div>
            <div className="reward-product-info"><span className="number-label">{product.slug}</span><h3>{product.name}</h3><p>{product.description}</p><button className="button dark" disabled={!canRedeem} onClick={() => { setError(''); setSelectedProduct(product) }}>{!authenticated ? 'Đăng nhập để đổi' : points < POINTS_PER_LEVEL ? 'Chưa đủ điểm' : 'Đổi quà này'} <Gift size={15} /></button></div>
        </article>)}</div>}
        {!authenticated && <p className="reward-login-note">Đăng nhập để xem số điểm và đổi quà. <Link to="/login" state={{ from: '/passport' }}>Đăng nhập</Link></p>}
        {selectedProduct && <div className="reward-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !submitting) setSelectedProduct(undefined) }}><section className="reward-dialog" role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title"><button type="button" className="icon-btn reward-dialog-close" aria-label="Đóng" disabled={submitting} onClick={() => setSelectedProduct(undefined)}><X size={17} /></button><p className="eyebrow">Đổi 500 điểm</p><h2 id="reward-dialog-title">Nhận {selectedProduct.name}</h2><p>Đơn đổi quà trị giá 0đ sẽ được tạo và chuyển vào tiến trình giao hàng.</p>{error && <p className="reward-feedback error" role="alert">{error}</p>}<form className="reward-form" onSubmit={redeem}><label>HỌ VÀ TÊN<input name="customerName" required maxLength={150} placeholder="Nguyễn Minh Linh" /></label><label>SỐ ĐIỆN THOẠI<input name="phone" required maxLength={50} placeholder="09xx xxx xxx" /></label><label>ĐỊA CHỈ NHẬN QUÀ<textarea name="shippingAddress" required maxLength={1000} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" /></label><button className="button dark" type="submit" disabled={submitting}>{submitting ? 'Đang đổi quà...' : 'Xác nhận đổi quà'} <Gift size={15} /></button></form></section></div>}
    </section>
}
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
    const [paymentState, setPaymentState] = useState<'waiting' | 'paid'>('waiting')
    const [paymentError, setPaymentError] = useState('')
    useEffect(() => {
        if (!order || order.paymentMethod !== 'PREPAID_QR' || order.paymentStatus === 'PAID') return
        const timer = window.setTimeout(async () => {
            try {
                const response = await api.post<{ data: { passportPointsAwarded: number } }>(`/orders/${order.id}/simulate-payment`)
                setOrder(current => current ? { ...current, paymentStatus: 'PAID', passportPointsAwarded: response.data.data.passportPointsAwarded } : current)
                setPaymentState('paid')
            } catch {
                setPaymentError('Không thể xác nhận thanh toán mô phỏng. Đơn vẫn được giữ ở trạng thái chờ thanh toán.')
            }
        }, 5000)
        return () => window.clearTimeout(timer)
    }, [order?.id, order?.paymentMethod, order?.paymentStatus])
    const retryPaymentConfirmation = async () => {
        if (!order) return
        setPaymentError('')
        try {
            const response = await api.post<{ data: { passportPointsAwarded: number } }>(`/orders/${order.id}/simulate-payment`)
            setOrder(current => current ? { ...current, paymentStatus: 'PAID', passportPointsAwarded: response.data.data.passportPointsAwarded } : current)
            setPaymentState('paid')
        } catch {
            setPaymentError('Không thể xác nhận thanh toán mô phỏng. Vui lòng thử lại.')
        }
    }
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
                paymentMethod: String(form.get('paymentMethod')) as PaymentMethod,
            })
            setOrder(result)
            if (result.paymentMethod === 'COD') setSent(true)
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
    return <main className="page"><div className="section-wrap checkout"><p className="eyebrow">FINAL STEP / CHECKOUT</p>{sent ? <div className="order-success"><div className="success-icon"><Check /></div><h1>Đơn hàng đã<br /><em>được ghi nhận.</em></h1><p>Cảm ơn bạn đã chọn mang một phần miền Tây về nhà. Mã đơn hàng của bạn là <b>{order?.orderCode}</b>.</p><p>Thanh toán khi nhận hàng (COD). Vui lòng thanh toán với nhân viên giao hàng khi nhận kiện.</p><p>Passport sẽ cộng 100 điểm sau khi bạn xác nhận nhận hàng.</p><Link className="button dark" to="/orders">Theo dõi đơn hàng <ArrowRight size={16} /></Link></div> : order?.paymentMethod === 'PREPAID_QR' ? <div className="payment-pending"><p className="eyebrow">ORDER {order.orderCode}</p><h1>{paymentState === 'paid' ? <>Thanh toán<br /><em>thành công.</em></> : <>Quét mã để<br /><em>thanh toán.</em></>}</h1>{paymentState === 'waiting' ? <><p>Đơn hàng {order.orderCode} · {money(order.totalAmount)}</p><img className="checkout-payment-qr" src={getQrCodeUrl(`MEKONG STORY BOX|${order.orderCode}|${order.totalAmount}|VND`)} alt={`Mã QR thanh toán đơn ${order.orderCode}`} /><p>Đang chờ ngân hàng xác nhận mô phỏng. Trạng thái sẽ tự cập nhật sau 5 giây.</p>{paymentError && <><p role="alert">{paymentError}</p><button className="button dark" onClick={() => void retryPaymentConfirmation()}>Thử xác nhận lại <ArrowRight size={16} /></button></>}</> : <><div className="success-icon"><Check /></div><p>Đã xác nhận thanh toán {money(order.totalAmount)} cho đơn {order.orderCode}.</p><p>Đã cộng {order.passportPointsAwarded} điểm vào Digital Passport.</p><Link className="button dark" to="/orders">Theo dõi đơn hàng <ArrowRight size={16} /></Link></>}</div> : <><h1>Đưa câu chuyện<br /><em>về nhà.</em></h1>{!isAuthenticated && <p role="alert">Đăng nhập để đặt hàng và ghi nhận vào Digital Passport. <Link to="/login" state={{ from: '/checkout' }}>Đăng nhập</Link></p>}{!hasItems && <p role="alert">Giỏ hàng đang trống. <Link to="/products">Chọn sản phẩm</Link></p>}{error && <p role="alert">{error}</p>}<form className="checkout-form" onSubmit={submit}><label>HỌ VÀ TÊN<input name="customerName" required maxLength={150} placeholder="Nguyễn Minh Linh" /></label><label>SỐ ĐIỆN THOẠI<input name="phone" required maxLength={50} placeholder="09xx xxx xxx" /></label><label>ĐỊA CHỈ NHẬN HÀNG<textarea name="shippingAddress" required maxLength={1000} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" /></label><fieldset className="payment-methods"><legend>PHƯƠNG THỨC THANH TOÁN</legend><label className="payment-method-option"><input type="radio" name="paymentMethod" value="PREPAID_QR" defaultChecked /><span><QrCode size={18} /><b>Chuyển khoản QR</b><small>Thanh toán trước khi giao hàng</small></span></label><label className="payment-method-option"><input type="radio" name="paymentMethod" value="COD" /><span><Package size={18} /><b>Thanh toán khi nhận hàng</b><small>Trả tiền trực tiếp khi nhận đơn</small></span></label></fieldset><button className="button dark" type="submit" disabled={!isAuthenticated || !hasItems || submitting}>{submitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'} <ArrowRight size={16} /></button></form></>}</div></main>
}
function About() { return <main className="page about"><div className="page-hero compact"><p className="eyebrow">OUR WHY</p><h1>Có một miền Tây<br /><em>luôn ở trong tim.</em></h1><p>Chúng tôi kể những câu chuyện văn hóa bằng ngôn ngữ của thế hệ hôm nay.</p></div><div className="section-wrap about-copy"><p className="large-copy">Mekong Story Box được bắt đầu bởi những người trẻ lớn lên bên dòng sông, nhưng đôi khi quên mất cách lắng nghe nó.</p><p>Chúng tôi tin rằng văn hóa không nằm yên trong bảo tàng. Văn hóa ở trong tiếng máy ghe lúc 5 giờ sáng, trong vị ngọt của trái dừa, trong những bàn tay khéo léo và trong cách một câu chuyện được truyền từ người này sang người khác.</p></div><section className="section-wrap about-values">{[[Leaf, 'Phù sa', 'Chọn nguyên liệu từ hộ sản xuất nhỏ, trả công xứng đáng cho người làm nghề.'], [Palmtree, 'Miệt vườn', 'Bao bì tre, lá dừa, lục bình — để chiếc hộp cũng là một món thủ công.'], [Heart, 'Thương nhớ', 'Mỗi hộp là một câu chuyện thật, kể bằng giọng của người miền Tây.']].map(([Icon, title, text]) => { const ValueIcon = Icon as typeof Leaf; return <article key={title as string}><ValueIcon size={24} /><h3>{title as string}</h3><p>{text as string}</p></article> })}</section><section className="section-wrap about-photo"><img src="/storybox_product.png" alt="Story Box trôi trên sông" /><p><em>“Văn hóa không nằm yên trong bảo tàng — nó trôi theo con nước.”</em></p></section></main> }
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
    return <main className="page auth-page"><div className="auth-card"><p className="eyebrow">MEKONG STORY BOX / ACCOUNT</p><h1>{mode === 'login' ? <>Chào mừng<br /><em>trở lại.</em></> : <>Bắt đầu<br /><em>hành trình.</em></>}</h1><form onSubmit={submit}>{mode === 'register' && <label>HỌ VÀ TÊN<input name="fullName" required maxLength={150} placeholder="Nguyễn Minh Linh" /></label>}<label>EMAIL<input name="email" type="email" required placeholder="you@example.com" /></label><label>MẬT KHẨU<input name="password" type="password" required minLength={8} maxLength={72} placeholder="Tối thiểu 8 ký tự" /></label>{error && <p role="alert">{error}</p>}<button className="button dark" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} <ArrowRight size={16} /></button></form><p className="auth-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <Link to={mode === 'login' ? '/register' : '/login'} state={{ from: returnTo }}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</Link></p></div></main>
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
        <Route path="/passport" element={<Passport user={user} />} />
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
