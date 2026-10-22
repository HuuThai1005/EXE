import { useEffect, useState } from 'react'
import type { PointerEvent } from 'react'
import { animate, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import type { MotionValue, Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, QrCode, RotateCcw, Sun } from 'lucide-react'
import { Fireflies, Ghe, Lotus, LucBinh, Palm, RiverWaves, Stork } from '../mekong/Motifs'

const ease = [0.16, 1, 0.3, 1] as const
const TITLE = [['Một', 'chuyến', 'về', 'miền', 'Tây,'], ['nằm', 'trong', 'một', 'chiếc', 'hộp.']]
const STATS: [number, string][] = [[13, 'bến sông'], [6, 'món quà'], [1, 'hộ chiếu số']]

const random = (seed: number) => () => (seed = seed * 16807 % 2147483647) / 2147483647
const n = (value: number) => value.toFixed(1)
/** Hàng cây ven sông phía xa: tán cây lô nhô và những cây dừa nhỏ nghiêng theo gió. */
function shoreLine(seed: number, base: number) {
    const next = random(seed)
    let canopy = `M0 160 L0 ${base + 8}`
    for (let x = 0; x < 1440;) {
        const width = 26 + next() * 58
        canopy += ` Q${n(x + width / 2)} ${n(base - 30 - next() * 36)} ${n(x + width)} ${n(base + next() * 12)}`
        x += width
    }
    const palms: string[] = []
    for (let i = 0; i < 15; i++) {
        const x = 30 + next() * 1380, height = 42 + next() * 48, lean = (next() - 0.5) * 28
        const tx = x + lean, ty = base - height
        palms.push(`M${n(x)} ${base + 4} Q${n(x + lean * 0.3)} ${n(base - height * 0.55)} ${n(tx)} ${n(ty)}`)
        for (const [dx, dy] of [[-24, 9], [-16, -4], [-6, -10], [6, -10], [16, -4], [24, 9], [-13, 15], [13, 15]]) palms.push(`M${n(tx)} ${n(ty)} Q${n(tx + dx * 0.5)} ${n(ty + dy * 0.5 - 7)} ${n(tx + dx)} ${n(ty + dy)}`)
    }
    return { canopy: canopy + ' L1440 160 Z', palms: palms.join('') }
}
const FAR_BACK = shoreLine(21, 112)
const FAR_FRONT = shoreLine(47, 132)

function FarShore() {
    return <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice">
        <path d={FAR_BACK.canopy} fill="#7a5f62" opacity=".55" />
        <path d={FAR_BACK.palms} stroke="#7a5f62" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".55" />
        <path d={FAR_FRONT.canopy} fill="#2b4c45" />
        <path d={FAR_FRONT.palms} stroke="#2b4c45" strokeWidth="5" strokeLinecap="round" fill="none" />
        <g stroke="#1d3833" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M190 152 Q300 128 410 152" />
            <path d="M190 132 Q300 108 410 132" />
            <path d="M212 148 V128 M246 141 V119 M282 137 V114 M318 137 V114 M354 141 V119 M388 148 V128" strokeWidth="2" />
            <path d="M236 162 L262 136 M262 162 L236 136 M338 162 L364 136 M364 162 L338 136" />
        </g>
    </svg>
}

function Bank() {
    const tufts = Array.from({ length: 22 }, (_, i) => { const x = 40 + i * 28; const y = 300 - (x / 640) * 112 - 4; return `M${x} ${n(y)} l-5 -12 M${x + 4} ${n(y)} l2 -15 M${x + 8} ${n(y)} l7 -10` }).join('')
    return <svg className="rh-bank-art" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMax meet">
        <defs><linearGradient id="bank-reflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d2f29" stopOpacity=".55" /><stop offset="1" stopColor="#0d2f29" stopOpacity="0" /></linearGradient></defs>
        <rect x="0" y="300" width="640" height="20" fill="url(#bank-reflect)" />
        <path d="M640 300 H0 Q60 262 150 248 Q300 224 430 206 Q540 192 640 182 Z" fill="#1d4636" />
        <path d={tufts} stroke="#2f6a4f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M300 214 H384" stroke="#6b4423" strokeWidth="7" />
        <path d="M310 214 V244 M342 214 V246 M372 214 V242 M396 210 V250 M424 206 V248 M482 200 V244 M510 198 V240" stroke="#3b2414" strokeWidth="5" />
        <rect x="380" y="198" width="144" height="10" fill="#6b4423" />
        <rect x="392" y="148" width="120" height="52" fill="#b88a4e" />
        <path d="M404 148 V200 M416 148 V200 M428 148 V200 M476 148 V200 M488 148 V200 M500 148 V200" stroke="#9a6d36" strokeWidth="1.5" />
        <rect x="444" y="162" width="22" height="38" fill="#3b2414" />
        <rect className="rh-window" x="404" y="162" width="24" height="16" fill="#ffcf6e" />
        <rect className="rh-window" x="476" y="162" width="24" height="16" fill="#ffcf6e" />
        <path d="M368 154 L452 98 L536 154 Z" fill="#7c5a2a" />
        <path d="M380 150 L452 102 M398 152 L454 106 M418 154 L456 110 M486 152 L452 104 M508 152 L454 106 M526 152 L452 102" stroke="#5e421c" strokeWidth="2" />
        <path d="M444 100 L460 100" stroke="#3b2414" strokeWidth="5" strokeLinecap="round" />
    </svg>
}

function useLayer(sx: MotionValue<number>, sy: MotionValue<number>, scrollY: MotionValue<number>, depth: number, drift: number) {
    const x = useTransform(sx, value => value * depth)
    const y = useTransform([sy, scrollY], ([pointer, scroll]: number[]) => pointer * depth * 0.6 + scroll * drift)
    return { x, y }
}

/** Trên điện thoại khối chữ nằm dưới màn hình đầu tiên, nên không làm mờ nó theo cuộn trang. */
function useWideScreen() {
    const query = '(min-width: 601px)'
    const [wide, setWide] = useState(() => window.matchMedia(query).matches)
    useEffect(() => {
        const list = window.matchMedia(query)
        const onChange = () => setWide(list.matches)
        list.addEventListener('change', onChange)
        return () => list.removeEventListener('change', onChange)
    }, [])
    return wide
}

function CountUp({ to, play, delay }: { to: number; play: boolean; delay: number }) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!play) { setValue(0); return }
        const controls = animate(0, to, { duration: 1.6, delay, ease: 'easeOut', onUpdate: latest => setValue(Math.round(latest)) })
        return () => controls.stop()
    }, [play, to, delay])
    return <>{value}</>
}

const instant = { duration: 0 }
const rise: Variants = { hidden: { opacity: 0, y: 26, transition: instant }, shown: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } }
const wordRise: Variants = { hidden: { y: '115%', rotate: 7, transition: instant }, shown: { y: '0%', rotate: 0, transition: { duration: 0.95, ease } } }
const layer = (hidden: Record<string, number | string>, delay: number, duration = 2.2): Variants => ({ hidden: { ...hidden, transition: instant }, shown: { x: 0, y: 0, opacity: 1, rotate: 0, transition: { duration, delay, ease } } })

export default function RiverHero({ play, onReplay }: { play: boolean; onReplay: () => void }) {
    const navigate = useNavigate()
    const pointerX = useMotionValue(0)
    const pointerY = useMotionValue(0)
    const sx = useSpring(pointerX, { stiffness: 45, damping: 16 })
    const sy = useSpring(pointerY, { stiffness: 45, damping: 16 })
    const { scrollY } = useScroll()
    const sun = useLayer(sx, sy, scrollY, -6, 0.38)
    const far = useLayer(sx, sy, scrollY, -10, 0.28)
    const bank = useLayer(sx, sy, scrollY, -18, 0.18)
    const boat = useLayer(sx, sy, scrollY, -26, 0.1)
    const front = useLayer(sx, sy, scrollY, -44, -0.06)
    const copyY = useTransform(scrollY, [0, 700], [0, -140])
    const copyOpacity = useTransform(scrollY, [0, 520], [1, 0])
    const wide = useWideScreen()
    const state = play ? 'shown' : 'hidden'
    const onPointerMove = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        pointerX.set((event.clientX - rect.left) / rect.width * 2 - 1)
        pointerY.set((event.clientY - rect.top) / rect.height * 2 - 1)
    }
    const scrollDown = () => document.getElementById('cay-beo')?.scrollIntoView({ behavior: 'smooth' })

    return <motion.section className="river-hero" initial="hidden" animate={state} onPointerMove={onPointerMove} onPointerLeave={() => { pointerX.set(0); pointerY.set(0) }}>
        <div className="rh-scene" aria-hidden="true">
            <div className="rh-sky" />
            <motion.div className="rh-sun-wrap" style={sun}>
                <motion.div className="rh-sun" variants={{ hidden: { y: '62%', transition: instant }, shown: { y: '0%', transition: { duration: 3.4, ease } } }}><span className="rh-sun-rays" /></motion.div>
            </motion.div>
            <div className="rh-clouds"><span /><span /><span /></div>
            <div className="rh-birds">{[0, 1, 2, 3, 4].map(i => <div className="rh-bird" key={i} style={{ ['--i' as string]: i }}><Stork /></div>)}</div>
            <motion.div className="rh-far" style={far}><motion.div className="rh-fill" variants={layer({ y: 40, opacity: 0 }, 0.2)}><FarShore /></motion.div></motion.div>
            <div className="rh-river">
                <div className="rh-glints">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}</div>
                <RiverWaves className="rh-waves" />
            </div>
            <div className="rh-drift">
                <div className="rh-farboat"><svg viewBox="0 0 100 30"><path d="M2 14 Q12 24 32 24 L72 24 Q90 22 98 8 L90 14 Q62 18 22 17 Z" fill="#203a35" /><path d="M36 17 V8 Q36 4 40 4 H60 Q64 4 64 8 V17 Z" fill="#203a35" /><path d="M14 14 L18 2 L22 14 Z" fill="#203a35" /></svg></div>
                <div className="rh-lucbinh a"><LucBinh /></div>
                <div className="rh-lucbinh b"><LucBinh /></div>
                <div className="rh-lucbinh c"><LucBinh /></div>
            </div>
            <motion.div className="rh-bank" style={bank}>
                <motion.div className="rh-fill" variants={layer({ x: 180, opacity: 0 }, 0.35, 2.4)}>
                    <Palm className="rh-palm p1" leaf="#356f2d" leafDark="#24521f" trunk="#5c3d22" />
                    <Palm className="rh-palm p2" leaf="#2f6628" leafDark="#1f481b" trunk="#4e3320" />
                    <Bank />
                </motion.div>
            </motion.div>
            <motion.div className="rh-boat" style={boat}>
                <motion.div variants={layer({ x: 520, opacity: 0 }, 0.5, 4.2)}><Ghe /></motion.div>
            </motion.div>
            <motion.div className="rh-front" style={front}>
                <motion.div className="rh-frond" variants={layer({ rotate: -28, opacity: 0 }, 0.45, 2.6)}><Palm crownOnly nuts={false} leaf="#24572a" leafDark="#183f1d" /></motion.div>
                <motion.div className="rh-lotus left" variants={{ hidden: { y: 220, transition: instant }, shown: { y: 0, transition: { type: 'spring', stiffness: 55, damping: 12, delay: 1 } } }}><Lotus /><Lotus bud className="bud" /></motion.div>
                <motion.div className="rh-lotus right" variants={{ hidden: { y: 220, transition: instant }, shown: { y: 0, transition: { type: 'spring', stiffness: 55, damping: 12, delay: 1.25 } } }}><Lotus bud className="bud" /><Lotus /></motion.div>
            </motion.div>
            <Fireflies count={20} seed={5} className="rh-dust" />
            <motion.div className="rh-dusk" variants={{ hidden: { opacity: 0.78, transition: instant }, shown: { opacity: 0, transition: { duration: 3, ease: 'easeOut' } } }} />
        </div>
        <div className="rh-veil" />

        <motion.div className="rh-copy" style={wide ? { y: copyY, opacity: copyOpacity } : undefined} variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } } }}>
            <motion.p className="rh-eyebrow" variants={rise}><Sun size={15} /> Đồng bằng sông Cửu Long</motion.p>
            <motion.p className="rh-script" variants={rise}>Thương về miền Tây…</motion.p>
            <h1 className="rh-title">{TITLE.map((line, lineIndex) => <span className={'rh-line' + (lineIndex ? ' em' : '')} key={lineIndex}>
                {line.map(word => <span className="rh-word" key={word}><motion.span variants={wordRise}>{word}</motion.span></span>)}
            </span>)}</h1>
            <motion.p className="rh-sub" variants={rise}>Mở nắp hộp, nghe tiếng ghe máy lúc năm giờ sáng, nếm vị ngọt kẹo dừa và mang theo câu chuyện của những người sống bên dòng Cửu Long.</motion.p>
            <motion.div className="rh-actions" variants={rise}>
                <button className="btn-mekong" onClick={() => navigate('/story-box')}>Chọn Story Box <ArrowRight size={18} /></button>
                <button className="btn-mekong-outline" onClick={() => navigate('/experience')}><QrCode size={18} /> Quét mã trải nghiệm</button>
            </motion.div>
            <motion.div className="rh-stats" variants={rise}>
                {STATS.map(([value, label], index) => <div key={label}><strong><CountUp to={value} play={play} delay={1.6 + index * 0.18} /></strong><span>{label}</span></div>)}
            </motion.div>
        </motion.div>

        <motion.div className="rh-bottom" variants={rise}>
            <button className="rh-cue" onClick={scrollDown}>Xuôi dòng<span /></button>
            <button className="rh-replay" onClick={onReplay}><RotateCcw size={14} /> Xem lại màn mở hộp</button>
        </motion.div>
    </motion.section>
}
