import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { BookOpen, Compass, Cookie, Gift, Mail, Map as MapIcon, MapPin, Package, Palmtree, QrCode, Stamp } from 'lucide-react'
import { Fireflies, Lantern, Stork, XuongTop } from '../mekong/Motifs'

const ease = [0.16, 1, 0.3, 1] as const
export const provinces = ['Cần Thơ', 'Bến Tre', 'Vĩnh Long', 'An Giang', 'Đồng Tháp', 'Sóc Trăng', 'Tiền Giang', 'Cà Mau', 'Bạc Liêu', 'Kiên Giang', 'Trà Vinh', 'Hậu Giang', 'Long An']
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

export const fadeInUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }
export const stagger = { visible: { transition: { staggerChildren: 0.12 } } }
export const reveal = { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-80px' }, variants: stagger } as const

export function KhanRanTicker() {
    return <div className="kr-band" aria-hidden="true">
        <div className="kr-track">{[...provinces, ...provinces].map((name, index) => <span key={index}>{name}<i>✿</i></span>)}</div>
    </div>
}

/** Ở chợ nổi, ghe bán gì thì treo món đó lên cây bẹo — sáu món quà trong hộp cũng được "bẹo" như vậy. */
export function BeoSection() {
    const rows = [boxContents.slice(0, 3), boxContents.slice(3)]
    return <section className="beo section-wrap" id="cay-beo">
        <motion.div {...reveal} className="section-heading center">
            <motion.span variants={fadeInUp} className="mekong-label">01 · Trong hộp có gì</motion.span>
            <motion.h2 variants={fadeInUp}>Bán gì thì <em>bẹo nấy.</em></motion.h2>
            <motion.p variants={fadeInUp}>Ở chợ nổi, ghe bán gì thì treo món đó lên cây bẹo cho khách nhìn từ xa. Story Box cũng vậy — sáu món quà treo sẵn đây, mời bạn ngắm trước.</motion.p>
        </motion.div>
        {rows.map((row, rowIndex) => <div className="beo-row" key={rowIndex}>
            <motion.div className="beo-pole" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '0px 0px -60px 0px' }} transition={{ duration: 1.1, ease }} />
            <div className="beo-track">
                {row.map(([Icon, title, text], itemIndex) => {
                    const index = rowIndex * 3 + itemIndex
                    return <motion.article className={'beo-tag tone-' + index % 4} key={title}
                        initial={{ y: -120, rotate: -14, opacity: 0 }} whileInView={{ y: 0, rotate: 0, opacity: 1 }} viewport={{ once: true, margin: '-60px' }}
                        transition={{ type: 'spring', stiffness: 70, damping: 8, delay: 0.35 + itemIndex * 0.16 }}>
                        <div className="beo-swing" style={{ animationDelay: `${-index * 0.8}s` }}>
                            <span className="beo-string" />
                            <div className="beo-card">
                                <span className="beo-no">0{index + 1}</span>
                                <span className="beo-icon"><Icon size={26} /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </div>
                        </div>
                    </motion.article>
                })}
            </div>
        </div>)}
    </section>
}

/** Dòng sông uốn khúc qua bốn bến: sông tự vẽ theo cuộn trang, chiếc xuồng trôi theo đúng đường nước. */
export function JourneyRiver() {
    const wrapRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const boatRef = useRef<HTMLDivElement>(null)
    const [geometry, setGeometry] = useState({ width: 0, height: 0, d: '' })
    const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start 70%', 'end 60%'] })
    const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, restDelta: 0.001 })

    const placeBoat = useCallback((value: number) => {
        const path = pathRef.current, boat = boatRef.current
        if (!path || !boat || !path.getAttribute('d')) return
        const total = path.getTotalLength()
        const at = Math.min(Math.max(value, 0), 1) * total
        const point = path.getPointAtLength(at)
        const ahead = path.getPointAtLength(Math.min(at + 4, total))
        const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI
        boat.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) rotate(${angle}deg)`
    }, [])
    useMotionValueEvent(progress, 'change', placeBoat)

    useLayoutEffect(() => {
        const wrap = wrapRef.current
        if (!wrap) return
        const measure = () => {
            const box = wrap.getBoundingClientRect()
            const points = Array.from(wrap.querySelectorAll<HTMLElement>('.jr-dot')).map(dot => {
                const rect = dot.getBoundingClientRect()
                return [rect.left + rect.width / 2 - box.left, rect.top + rect.height / 2 - box.top]
            })
            if (!points.length) return
            const amplitude = box.width < 720 ? 22 : Math.min(110, box.width * 0.09)
            const anchors = [[points[0][0], 0], ...points, [points[points.length - 1][0], box.height]]
            let d = `M${anchors[0][0].toFixed(1)} 0`
            for (let i = 1; i < anchors.length; i++) {
                const [x0, y0] = anchors[i - 1], [x1, y1] = anchors[i]
                const bend = (i % 2 ? 1 : -1) * amplitude, gap = y1 - y0
                d += ` C${(x0 + bend).toFixed(1)} ${(y0 + gap * 0.35).toFixed(1)} ${(x1 + bend).toFixed(1)} ${(y1 - gap * 0.35).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
            }
            setGeometry({ width: box.width, height: box.height, d })
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(wrap)
        return () => observer.disconnect()
    }, [])
    useLayoutEffect(() => placeBoat(progress.get()), [geometry, placeBoat, progress])

    return <section className="journey">
        <div className="section-wrap">
            <motion.div {...reveal} className="journey-head">
                <motion.span variants={fadeInUp} className="mekong-label light">02 · Xuôi dòng trải nghiệm</motion.span>
                <motion.h2 variants={fadeInUp}>Không chỉ là quà tặng.<br /><em>Đó là một chuyến đò.</em></motion.h2>
                <motion.p variants={fadeInUp}>Cuộn xuống để chiếc xuồng ghé từng bến — từ lúc mở nắp hộp tới khi đổi được chuyến đi kế tiếp.</motion.p>
            </motion.div>
            <div className="jr-wrap" ref={wrapRef}>
                <svg className="jr-svg" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width || 1} ${geometry.height || 1}`} aria-hidden="true">
                    <defs>
                        <mask id="jr-progress" maskUnits="userSpaceOnUse">
                            <motion.path d={geometry.d} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" style={{ pathLength: progress }} />
                        </mask>
                    </defs>
                    <path className="jr-bed" d={geometry.d} />
                    <path className="jr-flow" d={geometry.d} />
                    <path className="jr-trail" d={geometry.d} mask="url(#jr-progress)" />
                    <path ref={pathRef} d={geometry.d} fill="none" />
                </svg>
                <div className="jr-boat" ref={boatRef} aria-hidden="true"><XuongTop /></div>
                <ol className="jr-stops">
                    {journeySteps.map(([number, title, text, Icon], index) => <li className={'jr-stop ' + (index % 2 ? 'right' : 'left')} key={number}>
                        <span className="jr-dot"><Icon size={20} /></span>
                        <motion.div className="jr-card" initial={{ opacity: 0, x: index % 2 ? 70 : -70 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-120px' }} transition={{ duration: 0.9, ease }}>
                            <span className="jr-no">Bến {number}</span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </motion.div>
                    </li>)}
                </ol>
            </div>
        </div>
    </section>
}

/** Khung ảnh nghiêng theo con trỏ chuột, tạo cảm giác cầm hộp quà trên tay. */
export function TiltFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const springX = useSpring(rotateX, { stiffness: 140, damping: 14 })
    const springY = useSpring(rotateY, { stiffness: 140, damping: 14 })
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 14)
        rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 14)
    }
    return <motion.div className={'tilt-frame ' + className} style={{ rotateX: springX, rotateY: springY, transformPerspective: 1000 }} onPointerMove={onPointerMove} onPointerLeave={() => { rotateX.set(0); rotateY.set(0) }}>{children}</motion.div>
}

const CADAO = ['Đồng Tháp Mười cò bay thẳng cánh,', 'Nước Tháp Mười lóng lánh cá tôm.']
const cadaoWord = { hidden: { opacity: 0, y: 24, filter: 'blur(8px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease } } }
export function CaDaoBand() {
    const ref = useRef<HTMLElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
    return <section className="cadao" ref={ref}>
        <motion.div className="cadao-bg" style={{ y: backgroundY }} />
        <div className="cadao-shade" />
        <div className="cadao-birds" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <div className="rh-bird" key={i} style={{ ['--i' as string]: i }}><Stork /></div>)}</div>
        <motion.blockquote initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-120px' }} variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
            {CADAO.map(line => <span className="cadao-line" key={line}>{line.split(' ').map((word, index) => <Fragment key={index}><motion.span variants={cadaoWord}>{word}</motion.span>{' '}</Fragment>)}</span>)}
            <motion.cite variants={fadeInUp}>— Ca dao Nam Bộ —</motion.cite>
        </motion.blockquote>
    </section>
}

// Toạ độ (kinh độ, vĩ độ) gần đúng để vẽ bản đồ cách điệu đồng bằng sông Cửu Long.
// 200px cho mỗi độ; khung bắt đầu từ 103.7°E để có chỗ cho đảo Phú Quốc trong vịnh Thái Lan.
const MAP_WIDTH = 640
const MAP_HEIGHT = 520
const project = ([lon, lat]: number[]) => [(lon - 103.7) * 200, (11.1 - lat) * 200]
const toPath = (points: number[][], close = false) => points.map(project).map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + (close ? 'Z' : '')
const toCurve = (points: number[][]) => {
    const p = points.map(project)
    let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
    for (let i = 1; i < p.length; i++) {
        const [x0, y0] = p[i - 1], [x1, y1] = p[i]
        d += ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`
    }
    return d + ` L${p[p.length - 1][0].toFixed(1)} ${p[p.length - 1][1].toFixed(1)}`
}
const DELTA_LAND = toPath([[104.48, 10.39], [104.9, 10.55], [105.1, 10.95], [105.45, 10.98], [105.9, 10.96], [106.15, 11.03], [106.42, 10.96], [106.58, 10.76], [106.76, 10.6], [106.8, 10.38], [106.76, 10.12], [106.62, 9.86], [106.52, 9.62], [106.22, 9.42], [105.86, 9.18], [105.45, 8.9], [104.72, 8.6], [104.84, 8.98], [104.86, 9.32], [104.96, 9.62], [105.06, 9.86], [105.08, 10.01], [104.94, 10.15], [104.74, 10.26]], true)
const PHU_QUOC = toPath([[103.93, 10.44], [104.03, 10.45], [104.07, 10.38], [104.05, 10.25], [104.06, 10.15], [104.02, 10.06], [103.99, 9.98], [103.96, 10.05], [103.97, 10.15], [103.95, 10.24], [103.9, 10.3], [103.84, 10.37], [103.88, 10.42]], true)
const [phuQuocX, phuQuocY] = project([103.99, 9.98])
// Tuyến tàu cao tốc Rạch Giá — Phú Quốc
const FERRY = (() => {
    const [x0, y0] = project([105.06, 10.0]), [x1, y1] = project([104.08, 10.12])
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2).toFixed(1)} ${(y0 + 36).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
})()
const RIVER_TIEN = toCurve([[105.3, 11.0], [105.24, 10.8], [105.38, 10.7], [105.63, 10.46], [105.78, 10.3], [105.97, 10.27], [106.2, 10.32], [106.4, 10.33], [106.62, 10.27], [106.82, 10.22]])
const RIVER_HAU = toCurve([[105.0, 10.98], [105.12, 10.7], [105.3, 10.52], [105.43, 10.38], [105.6, 10.2], [105.78, 10.03], [105.96, 9.82], [106.14, 9.66], [106.34, 9.52]])
const RIVER_COCHIEN = toCurve([[106.0, 10.24], [106.18, 10.06], [106.38, 9.92], [106.62, 9.74]])
const RIVER_HAMLUONG = toCurve([[106.24, 10.3], [106.4, 10.14], [106.58, 9.98], [106.76, 9.92]])
const PLACES: Record<string, { at: [number, number]; label: 'left' | 'right' | 'top' | 'bottom' }> = {
    'Cần Thơ': { at: [105.78, 10.03], label: 'right' }, 'Bến Tre': { at: [106.37, 10.2], label: 'right' }, 'Vĩnh Long': { at: [105.97, 10.25], label: 'top' },
    'An Giang': { at: [105.43, 10.38], label: 'left' }, 'Đồng Tháp': { at: [105.63, 10.46], label: 'top' }, 'Sóc Trăng': { at: [105.97, 9.6], label: 'right' },
    'Tiền Giang': { at: [106.36, 10.4], label: 'right' }, 'Cà Mau': { at: [105.15, 9.18], label: 'left' }, 'Bạc Liêu': { at: [105.72, 9.29], label: 'right' },
    'Kiên Giang': { at: [105.08, 10.01], label: 'top' }, 'Trà Vinh': { at: [106.34, 9.93], label: 'right' }, 'Hậu Giang': { at: [105.47, 9.78], label: 'left' }, 'Long An': { at: [106.41, 10.6], label: 'right' },
}
const labelOffset = { left: [-11, 4, 'end'], right: [11, 4, 'start'], top: [0, -12, 'middle'], bottom: [0, 18, 'middle'] } as const

export function DeltaMap() {
    return <section className="delta section-wrap">
        <motion.div {...reveal} className="delta-card">
            <div className="delta-copy">
                <motion.span variants={fadeInUp} className="mekong-label light">04 · Bản đồ hành trình</motion.span>
                <motion.h2 variants={fadeInUp}>Mười ba tỉnh thành,<br /><em>mười ba chiếc hộp.</em></motion.h2>
                <motion.p variants={fadeInUp}>Sông Tiền, sông Hậu chia nhau chín cửa ra biển. Mỗi mùa, chúng tôi xuôi về một bến mới — Cần Thơ là chuyến đầu tiên, những chuyến kế tiếp đang được chuẩn bị.</motion.p>
                <motion.ul variants={fadeInUp} className="delta-tickets">
                    {provinces.map((name, index) => <li className={index === 0 ? 'open' : index < 3 ? 'soon' : ''} key={name}>
                        <span>#{String(index + 1).padStart(3, '0')}</span><b>{index < 3 && <MapPin size={12} />}{name}</b>{index < 3 && <small>{index === 0 ? 'Đang mở' : 'Sắp cập bến'}</small>}
                    </li>)}
                </motion.ul>
            </div>
            <motion.div variants={fadeInUp} className="delta-map">
                <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Bản đồ cách điệu đồng bằng sông Cửu Long với 13 tỉnh thành và đảo Phú Quốc">
                    <text className="dm-sea" x="530" y="470">BIỂN ĐÔNG</text>
                    <text className="dm-sea" x="40" y="330">VỊNH THÁI LAN</text>
                    <motion.path className="dm-land" d={DELTA_LAND} initial={{ pathLength: 0, fillOpacity: 0 }} whileInView={{ pathLength: 1, fillOpacity: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, ease: 'easeInOut' }} />
                    <motion.path className="dm-ferry" d={FERRY} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 2.2 }} />
                    <motion.path className="dm-land island" d={PHU_QUOC} initial={{ pathLength: 0, fillOpacity: 0 }} whileInView={{ pathLength: 1, fillOpacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 1.2, ease: 'easeInOut' }} />
                    <motion.text className="dm-island" x={phuQuocX} y={phuQuocY + 18} textAnchor="middle" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 2 }}>Đảo Phú Quốc</motion.text>
                    {[RIVER_TIEN, RIVER_HAU, RIVER_COCHIEN, RIVER_HAMLUONG].map((d, index) => <motion.path key={index} className={'dm-river' + (index > 1 ? ' branch' : '')} d={d} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, delay: 0.6 + index * 0.25, ease: 'easeInOut' }} />)}
                    {provinces.map((name, index) => {
                        const place = PLACES[name]
                        const [x, y] = project(place.at)
                        const [dx, dy, anchor] = labelOffset[place.label]
                        const status = index === 0 ? 'open' : index < 3 ? 'soon' : 'later'
                        return <motion.g key={name} className={'dm-place ' + status} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 1.4 + index * 0.08 }}>
                            {status !== 'later' && <circle className="dm-pulse" cx={x} cy={y} r={9} />}
                            <circle className="dm-dot" cx={x} cy={y} r={status === 'open' ? 7 : 5} />
                            <text className="dm-label" x={x + dx} y={y + dy} textAnchor={anchor}>{name}</text>
                        </motion.g>
                    })}
                </svg>
                <div className="dm-boat" style={{ left: `${project(PLACES['Cần Thơ'].at)[0] / MAP_WIDTH * 100}%`, top: `${project(PLACES['Cần Thơ'].at)[1] / MAP_HEIGHT * 100}%` }}><XuongTop /></div>
            </motion.div>
        </motion.div>
    </section>
}

const LANTERNS = [
    { left: '6%', top: 26, width: 46, color: '#e0452f', delay: 0 },
    { left: '19%', top: 44, width: 38, color: '#f2a23a', delay: -1.2 },
    { left: '33%', top: 30, width: 52, color: '#e0452f', delay: -0.5 },
    { left: '50%', top: 48, width: 40, color: '#e0567f', delay: -2 },
    { left: '66%', top: 28, width: 50, color: '#f2a23a', delay: -0.9 },
    { left: '81%', top: 46, width: 40, color: '#e0452f', delay: -1.6 },
    { left: '92%', top: 24, width: 34, color: '#e0567f', delay: -0.3 },
]
const CTA_STAMPS = [
    { name: 'Chợ nổi', place: 'Cái Răng', tone: 'sun', x: '6%', y: '8%', rotate: -12 },
    { name: 'Xứ dừa', place: 'Bến Tre', tone: 'leaf', x: '46%', y: '0%', rotate: 9 },
    { name: 'Đờn ca', place: 'Tài tử', tone: 'lotus', x: '24%', y: '46%', rotate: -4 },
]

export function LanternCta({ onPassport, onScan }: { onPassport: () => void; onScan: () => void }) {
    return <section className="lantern-cta section-wrap">
        <div className="lc-card">
            <svg className="lc-string" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18 Q250 70 500 40 T1000 22" /></svg>
            {LANTERNS.map((lantern, index) => <div className="lc-lantern" key={index} style={{ left: lantern.left, top: lantern.top, width: lantern.width, animationDelay: `${lantern.delay}s` }}><Lantern color={lantern.color} /></div>)}
            <Fireflies count={26} seed={13} className="lc-fireflies" />
            <motion.div {...reveal} className="lc-copy">
                <motion.span variants={fadeInUp} className="mekong-label light">06 · Digital Passport</motion.span>
                <motion.h2 variants={fadeInUp}>Mỗi con dấu<br /><em>là một bến sông.</em></motion.h2>
                <motion.p variants={fadeInUp}>Quét mã QR trong hộp để mở khóa câu chuyện, nhận điểm và sưu tầm huy hiệu Chợ nổi, Miệt vườn, Đờn ca tài tử… Đủ 500 điểm, đổi ngay một chuyến về miền Tây mới.</motion.p>
                <motion.div variants={fadeInUp} className="lc-actions">
                    <button className="btn-mekong" onClick={onPassport}>Mở Passport <Compass size={18} /></button>
                    <button className="btn-mekong-outline" onClick={onScan}><QrCode size={18} /> Quét QR</button>
                </motion.div>
            </motion.div>
            <div className="lc-stamps" aria-hidden="true">
                {CTA_STAMPS.map((stamp, index) => <motion.div key={stamp.name} className={'lc-stamp ' + stamp.tone} style={{ left: stamp.x, top: stamp.y }}
                    initial={{ opacity: 0, scale: 2.6, rotate: stamp.rotate - 30 }} whileInView={{ opacity: 1, scale: 1, rotate: stamp.rotate }} viewport={{ once: true, margin: '-80px' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.4 + index * 0.35 }}>
                    <small>MEKONG · {String(index + 1).padStart(3, '0')}</small><b>{stamp.name}</b><small>{stamp.place}</small>
                </motion.div>)}
            </div>
        </div>
    </section>
}
