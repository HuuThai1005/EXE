import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Cookie, Mail, Map as MapIcon, Palmtree, Stamp } from 'lucide-react'
import { BrandMark, Fireflies, Palm, RiverWaves } from '../mekong/Motifs'

// Mốc thời gian (ms): tháo nơ → mở nắp → lao vào ánh sáng → kết thúc
const TIMELINE = { untie: 3100, open: 3700, dive: 5300, done: 6200 }
const VERSE = ['Cần Thơ gạo trắng nước trong,', 'Ai đi đến đó lòng không muốn về.']
const GIFTS = [
    { Icon: Mail, color: '#e0567f', x: -420, y: -40, rotate: -16 },
    { Icon: MapIcon, color: '#23806a', x: -330, y: -165, rotate: 10 },
    { Icon: Cookie, color: '#a65a24', x: -135, y: -215, rotate: -8 },
    { Icon: Palmtree, color: '#4c8b2f', x: 135, y: -215, rotate: 12 },
    { Icon: BookOpen, color: '#ee7a2a', x: 330, y: -165, rotate: -12 },
    { Icon: Stamp, color: '#0b3d36', x: 420, y: -40, rotate: 16 },
]

const random = (seed: number) => () => (seed = seed * 16807 % 2147483647) / 2147483647
const PIECES = (() => {
    const next = random(11)
    return Array.from({ length: 30 }, (_, index) => ({
        kind: index % 3 === 0 ? 'leaf' : index % 3 === 1 ? 'petal' : 'gold',
        x: (next() - 0.5) * 980, up: 140 + next() * 280, fall: 260 + next() * 340,
        spin: (next() - 0.5) * 900, delay: next() * 0.4, duration: 2.2 + next() * 1.2, size: 9 + next() * 12,
    }))
})()
const STARS = (() => {
    const next = random(29)
    return Array.from({ length: 60 }, () => ({ left: next() * 100, top: next() * 56, size: next() > 0.85 ? 3 : 1.5, delay: -next() * 4 }))
})()

function Bow() {
    return <svg viewBox="0 0 120 74" aria-hidden="true">
        <defs>
            <pattern id="intro-bow-kr" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#f3ead6" />
                <rect width="4" height="8" fill="#141414" opacity=".78" />
                <rect width="8" height="4" fill="#141414" opacity=".78" />
            </pattern>
        </defs>
        <path d="M56 40 L38 72 L48 67 L54 74 L62 42 Z" fill="url(#intro-bow-kr)" stroke="#141414" strokeWidth="1.6" />
        <path d="M64 40 L82 72 L72 67 L66 74 L58 42 Z" fill="url(#intro-bow-kr)" stroke="#141414" strokeWidth="1.6" />
        <path d="M60 34 C40 4 6 8 9 30 C12 52 42 46 60 34 Z" fill="url(#intro-bow-kr)" stroke="#141414" strokeWidth="2" />
        <path d="M60 34 C80 4 114 8 111 30 C108 52 78 46 60 34 Z" fill="url(#intro-bow-kr)" stroke="#141414" strokeWidth="2" />
        <rect x="51" y="25" width="18" height="18" rx="5" fill="url(#intro-bow-kr)" stroke="#141414" strokeWidth="2" />
    </svg>
}

function LotusSeal() {
    return <svg viewBox="0 0 60 60" aria-hidden="true">
        <g fill="#f3d9a4" opacity=".92">
            <path d="M30 44 C24 36 24 24 30 14 C36 24 36 36 30 44 Z" />
            <path d="M30 44 C20 40 15 30 16 20 C25 24 30 34 30 44 Z" />
            <path d="M30 44 C40 40 45 30 44 20 C35 24 30 34 30 44 Z" />
            <path d="M14 46 Q30 52 46 46 Q30 49 14 46 Z" />
        </g>
    </svg>
}

export default function OpeningCurtain({ onDone }: { onDone: () => void }) {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const timers = [
            window.setTimeout(() => setPhase(1), TIMELINE.untie),
            window.setTimeout(() => setPhase(2), TIMELINE.open),
            window.setTimeout(() => setPhase(3), TIMELINE.dive),
            window.setTimeout(onDone, TIMELINE.done),
        ]
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') onDone() }
        window.addEventListener('keydown', onKey)
        return () => { timers.forEach(window.clearTimeout); window.removeEventListener('keydown', onKey) }
    }, [onDone])

    const opened = phase >= 2
    const diving = phase >= 3
    const className = ['intro', phase >= 1 && 'is-untied', opened && 'is-open', diving && 'is-diving'].filter(Boolean).join(' ')

    return <motion.div className={className} role="dialog" aria-label="Màn mở hộp Mekong Story Box" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeInOut' } }}>
        <div className="intro-sky night" />
        <div className="intro-sky dawn" />
        <div className="intro-stars" aria-hidden="true">{STARS.map((star, index) => <span key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />)}</div>

        <motion.div className="intro-palm left" aria-hidden="true" initial={{ x: '-45%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
            <Palm leaf="#0b2328" leafDark="#071a1e" trunk="#0a1d22" nuts={false} />
        </motion.div>
        <motion.div className="intro-palm right" aria-hidden="true" initial={{ x: '45%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}>
            <Palm leaf="#0b2328" leafDark="#071a1e" trunk="#0a1d22" nuts={false} />
        </motion.div>

        <div className="intro-water" aria-hidden="true"><div className="intro-glint" /><RiverWaves /></div>
        <Fireflies count={30} seed={3} className="intro-fireflies" />

        <motion.div className="intro-brand" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <BrandMark /><span>MEKONG <b>Story Box</b></span>
        </motion.div>
        <div className="intro-verse">
            {VERSE.map((line, index) => <p className="iv-line" key={line} style={{ animationDelay: `${0.45 + index * 1.25}s` }}>{line}</p>)}
            <small>— Ca dao Nam Bộ —</small>
        </div>

        <div className="mh-stage" aria-hidden="true">
            <motion.div className="mh-float"
                initial={{ y: 170, opacity: 0, scale: 0.9 }}
                animate={diving ? { y: 40, opacity: 1, scale: 8 } : { y: 0, opacity: 1, scale: 1 }}
                transition={diving ? { duration: 1.05, ease: [0.64, 0, 0.78, 0] } : { duration: 1.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}>
                <div className="mh-rays" />
                <div className="mh-bob">
                    <div className="mh-box">
                        <div className="mh-face mh-back" />
                        <div className="mh-face mh-left" />
                        <div className="mh-face mh-right" />
                        <div className="mh-face mh-bottom" />
                        <div className="mh-glow-plane" />
                        <div className="mh-face mh-front"><span className="mh-ribbon mh-ribbon-v" /><span className="mh-plate">CẦN THƠ · #001</span></div>
                        <div className="mh-lid">
                            <div className="mh-face mh-lid-top"><span className="mh-emblem"><LotusSeal /></span><span className="mh-ribbon mh-ribbon-v" /><span className="mh-ribbon mh-ribbon-h" /></div>
                            <div className="mh-face mh-lid-inner"><span className="mh-emblem"><LotusSeal /></span></div>
                            <div className="mh-face mh-lid-back" />
                            <div className="mh-face mh-lid-left" />
                            <div className="mh-face mh-lid-right" />
                            <div className="mh-face mh-lid-front"><span className="mh-ribbon mh-ribbon-v" /><span className="mh-bow"><Bow /></span></div>
                        </div>
                    </div>
                </div>
                <div className="mh-light" />
                <div className="mh-burst">
                    {[-1, 1].map(side => <motion.span key={side} className="mh-ribbon-fly"
                        initial={{ opacity: 0 }}
                        animate={phase >= 1 ? { opacity: [0, 1, 1, 0], x: side * 260, y: [-10, -90, 120], rotate: side * 160 } : { opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }} />)}
                    {PIECES.map((piece, index) => <motion.span key={index} className={'mh-piece ' + piece.kind} style={{ width: piece.size, height: piece.kind === 'gold' ? piece.size * 0.6 : piece.size * 1.5 }}
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={opened ? { opacity: [0, 1, 1, 0], x: [0, piece.x * 0.3, piece.x * 0.8, piece.x], y: [0, -piece.up, -piece.up + piece.fall * 0.6, -piece.up + piece.fall], rotate: [0, piece.spin * 0.2, piece.spin * 0.7, piece.spin] } : { opacity: 0, x: 0, y: 0 }}
                        transition={{ duration: piece.duration, delay: 0.15 + piece.delay, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }} />)}
                    {GIFTS.map(({ Icon, color, x, y, rotate }, index) => <motion.span key={index} className="mh-gift" style={{ background: color }}
                        initial={{ opacity: 0, scale: 0.2, x: 0, y: 30 }}
                        animate={diving ? { opacity: 0, scale: 0.6, x: x * 1.6, y: y * 1.5, rotate: rotate * 2 } : opened ? { opacity: 1, scale: 1, x, y, rotate } : { opacity: 0, scale: 0.2, x: 0, y: 30 }}
                        transition={diving ? { duration: 0.7, ease: 'easeIn' } : { type: 'spring', stiffness: 90, damping: 11, delay: 0.25 + index * 0.08 }}>
                        <Icon size={24} />
                    </motion.span>)}
                </div>
            </motion.div>
            <div className="mh-ripples"><span /><span /><span /></div>
        </div>

        <div className="intro-flash" aria-hidden="true" />
        <button type="button" className="intro-skip" onClick={onDone}>Bỏ qua <span aria-hidden="true">›</span></button>
        <div className="intro-progress" aria-hidden="true"><span /></div>
    </motion.div>
}
