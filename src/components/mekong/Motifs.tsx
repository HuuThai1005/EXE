import { useId, useMemo } from 'react'
import type { CSSProperties } from 'react'

type Pt = [number, number]
type ArtProps = { className?: string; style?: CSSProperties }

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]
const quadTangent = (a: Pt, c: Pt, b: Pt, t: number): Pt => [2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1])]
const n = (value: number) => value.toFixed(1)
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')

/** Sinh một tàu lá dừa: gân lá cong theo bezier, các lá chét rủ xuống theo trọng lực. */
function frondPath(angle: number, length: number, droop: number, leaf: number, count = 18) {
    const rad = angle * Math.PI / 180
    const a: Pt = [0, 0]
    const b: Pt = [Math.cos(rad) * length, Math.sin(rad) * length + droop]
    const c: Pt = [Math.cos(rad) * length * 0.55, Math.sin(rad) * length * 0.55 - droop * 0.5]
    const step = 1 / (count + 1)
    const half = step * 0.3
    const out: string[] = []
    const back: string[] = []
    for (let i = 1; i <= count; i++) {
        const t = i * step
        const [mx, my] = quad(a, c, b, t)
        const [dx, dy] = quadTangent(a, c, b, t)
        const len = Math.hypot(dx, dy) || 1
        const tx = dx / len, ty = dy / len, nx = -ty, ny = tx
        const size = leaf * Math.pow(Math.sin(Math.PI * Math.min(t * 1.08, 1)), 0.55)
        const tip = (side: number): Pt => [mx + (nx * side * 0.62 + tx * 0.78) * size, my + (ny * side * 0.62 + ty * 0.78) * size + size * 0.42]
        const before = quad(a, c, b, t - half)
        const after = quad(a, c, b, t + half)
        const [ax, ay] = tip(1)
        const [bx, by] = tip(-1)
        out.push(`L${n(before[0])} ${n(before[1])}L${n(ax)} ${n(ay)}L${n(after[0])} ${n(after[1])}`)
        back.unshift(`L${n(after[0])} ${n(after[1])}L${n(bx)} ${n(by)}L${n(before[0])} ${n(before[1])}`)
    }
    return { leaf: `M0 0${out.join('')}L${n(b[0])} ${n(b[1])}${back.join('')}Z`, rib: `M0 0Q${n(c[0])} ${n(c[1])} ${n(b[0])} ${n(b[1])}` }
}

function trunkPath(a: Pt, c: Pt, b: Pt, w0: number, w1: number, steps = 24) {
    const left: string[] = []
    const right: string[] = []
    const rings: string[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const [x, y] = quad(a, c, b, t)
        const [dx, dy] = quadTangent(a, c, b, t)
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len, ny = dx / len, w = (w0 + (w1 - w0) * t) / 2
        left.push(`${n(x + nx * w)} ${n(y + ny * w)}`)
        right.unshift(`${n(x - nx * w)} ${n(y - ny * w)}`)
        if (i > 0 && i < steps) rings.push(`M${n(x + nx * w)} ${n(y + ny * w)}Q${n(x)} ${n(y + 4)} ${n(x - nx * w)} ${n(y - ny * w)}`)
    }
    return { body: `M${left.join('L')}L${right.join('L')}Z`, rings: rings.join('') }
}

// [góc, độ dài, độ rủ, cỡ lá chét] cho từng tàu lá của tán dừa
const CROWN: [number, number, number, number][] = [
    [-168, 150, 85, 32], [-138, 140, 45, 31], [-104, 118, 18, 27], [-74, 122, 22, 28], [-40, 145, 50, 32],
    [-8, 152, 88, 32], [32, 120, 112, 26], [148, 120, 112, 26], [-120, 92, 6, 20], [-58, 96, 8, 21],
]
const CROWN_TOP: Pt = [178, 168]
const palmFronds = CROWN.map(([angle, length, droop, leaf]) => frondPath(angle, length, droop, leaf))
const palmTrunk = trunkPath([150, 620], [118, 380], CROWN_TOP, 22, 11)

export function Palm({ className = '', style, leaf = '#3f7d34', leafDark = '#2b5e27', trunk = '#7a5230', nuts = true, crownOnly = false }: ArtProps & { leaf?: string; leafDark?: string; trunk?: string; nuts?: boolean; crownOnly?: boolean }) {
    return <svg className={'palm ' + className} style={style} viewBox={crownOnly ? '-30 -40 410 460' : '-30 10 410 612'} aria-hidden="true">
        <g className="palm-tree">
            {!crownOnly && <path d={palmTrunk.body} fill={trunk} />}
            {!crownOnly && <path d={palmTrunk.rings} fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="2" />}
            <g transform={`translate(${CROWN_TOP[0]} ${CROWN_TOP[1]})`}>
                <g className="palm-crown">
                    {palmFronds.map((frond, index) => <g key={index}>
                        <path d={frond.leaf} fill={index % 3 === 1 ? leafDark : leaf} />
                        <path d={frond.rib} fill="none" stroke={leafDark} strokeWidth="3" strokeLinecap="round" />
                    </g>)}
                    {nuts && <g>
                        <circle cx="-9" cy="10" r="10" fill="#6c8f2c" />
                        <circle cx="8" cy="12" r="10" fill="#5a7c25" />
                        <circle cx="-1" cy="22" r="9.5" fill="#7a9b33" />
                    </g>}
                </g>
            </g>
        </g>
    </svg>
}

/** Ghe chợ nổi: người chèo đội nón lá, quấn khăn rằn, cây bẹo treo trái cây và đôi mắt ghe ở mũi. */
export function Ghe({ className = '', style, shirt = '#2f5d8a' }: ArtProps & { shirt?: string }) {
    const id = safeId(useId())
    return <svg className={'ghe ' + className} style={style} viewBox="-10 20 420 210" aria-hidden="true">
        <defs>
            <pattern id={`kr-${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#f3ead6" />
                <rect width="3" height="6" fill="#1b1b1b" opacity=".7" />
                <rect width="6" height="3" fill="#1b1b1b" opacity=".7" />
            </pattern>
            <linearGradient id={`hull-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8a4e26" />
                <stop offset="1" stopColor="#4a2612" />
            </linearGradient>
        </defs>
        <g className="ghe-body">
            <g className="ghe-beo">
                <line x1="322" y1="170" x2="322" y2="40" stroke="#8a5a2b" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="322" cy="56" rx="8.5" ry="12" fill="#e9a23b" />
                <path d="M316 56 l12 -6 M316 62 l12 -6 M316 50 l12 -6" stroke="#b9741f" strokeWidth="1.4" />
                <path d="M322 44 l-7 -14 l7 6 l2 -10 l3 10 l6 -6 z" fill="#4f8a3c" />
                <g className="ghe-beo-hang">
                    <line x1="322" y1="74" x2="334" y2="86" stroke="#5b3a1c" strokeWidth="1.5" />
                    <circle cx="338" cy="94" r="9" fill="#5f8f2e" />
                    <circle cx="335" cy="91" r="2.4" fill="#a8c76a" opacity=".7" />
                </g>
            </g>
            <path d="M136 168 L136 132 Q200 86 266 132 L266 168 Z" fill="#c8914a" />
            <path d="M136 132 Q200 86 266 132 L266 140 Q200 96 136 140 Z" fill="#a8722f" />
            <path d="M150 164 L150 124 M168 164 L168 112 M186 164 L186 106 M204 164 L204 104 M222 164 L222 107 M240 164 L240 113 M256 164 L256 124" stroke="#9b6a32" strokeWidth="2" />
            <path d="M188 168 L188 140 Q200 130 214 140 L214 168 Z" fill="#3d2414" opacity=".7" />
            <g>
                <ellipse cx="282" cy="160" rx="13" ry="10" fill="#2f7a3a" />
                <path d="M272 158 q10 -6 20 0 M272 163 q10 -6 20 0" stroke="#1d5528" strokeWidth="1.6" fill="none" />
                <circle cx="304" cy="162" r="8" fill="#6c9a30" />
                <ellipse cx="296" cy="150" rx="7" ry="5" fill="#f2b632" />
                <ellipse cx="284" cy="146" rx="7" ry="5" fill="#f6c247" />
                <path d="M266 156 q4 -12 10 -2 q4 -10 8 0" fill="#e0457b" />
                <circle cx="312" cy="152" r="6.5" fill="#e65a3a" />
            </g>
            <path d="M14 136 Q40 166 90 168 L310 168 Q370 164 396 124 Q382 186 320 196 L90 196 Q34 192 14 136 Z" fill={`url(#hull-${id})`} />
            <path d="M20 144 Q46 172 92 174 L310 174 Q366 170 390 134" fill="none" stroke="#e1553a" strokeWidth="4" />
            <path d="M24 152 Q50 178 94 180 L308 180 Q362 176 384 146" fill="none" stroke="#2f6f8f" strokeWidth="3" />
            <ellipse cx="362" cy="160" rx="10" ry="6.5" fill="#fffaf0" stroke="#c2321f" strokeWidth="2" />
            <circle cx="364" cy="160" r="3.6" fill="#1b1b1b" />
            <g className="ghe-rower">
                <path d="M55 168 L58 128 L70 128 L72 168 L65 168 L64 142 L61 168 Z" fill="#1f1d1b" />
                <path d="M52 132 Q50 106 60 99 L70 99 Q80 106 75 132 Z" fill={shirt} />
                <path d="M57 99 Q64 107 72 99 L73 104 Q64 112 56 104 Z" fill={`url(#kr-${id})`} />
                <path d="M70 104 L76 120" stroke={`url(#kr-${id})`} strokeWidth="4" strokeLinecap="round" />
                <circle cx="64" cy="92" r="7" fill="#c98a5a" />
                <path d="M40 91 L64 68 L88 91 Q64 96 40 91 Z" fill="#ead39a" />
                <path d="M46 89 L64 71 M53 90 L64 71 M64 93 L64 71 M75 90 L64 71 M82 89 L64 71" stroke="#c9a85e" strokeWidth="1" />
                <g className="ghe-oar">
                    <line x1="80" y1="106" x2="6" y2="214" stroke="#7a4a22" strokeWidth="4" strokeLinecap="round" />
                    <path d="M14 200 L-2 226 L-8 220 L8 196 Z" fill="#5b3a1c" />
                    <path d="M68 108 Q76 112 84 108" stroke={shirt} strokeWidth="6" strokeLinecap="round" fill="none" />
                </g>
            </g>
        </g>
        <path className="ghe-ripple" d="M0 202 Q60 196 120 202 T240 202 T360 202 T420 202" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
    </svg>
}

/** Xuồng nhìn từ trên xuống, dùng cho hành trình xuôi dòng. */
export function XuongTop({ className = '', style }: ArtProps) {
    return <svg className={'xuong ' + className} style={style} viewBox="0 0 80 32" aria-hidden="true">
        <path d="M2 16 Q18 2 52 4 Q72 6 78 16 Q72 26 52 28 Q18 30 2 16 Z" fill="#7a4a22" />
        <path d="M8 16 Q22 7 52 8 Q68 10 72 16 Q68 22 52 24 Q22 25 8 16 Z" fill="#a8652e" />
        <circle cx="34" cy="16" r="9" fill="#ead39a" />
        <path d="M34 7 V25 M25 16 H43 M28 10 L40 22 M40 10 L28 22" stroke="#c9a85e" strokeWidth="1" />
        <ellipse cx="60" cy="16" rx="6" ry="4" fill="#5f8f2e" />
    </svg>
}

export function LucBinh({ className = '', style }: ArtProps) {
    return <svg className={'lucbinh ' + className} style={style} viewBox="0 0 140 80" aria-hidden="true">
        <ellipse cx="70" cy="68" rx="56" ry="8" fill="rgba(6,32,26,.35)" />
        <ellipse cx="40" cy="58" rx="22" ry="11" transform="rotate(-18 40 58)" fill="#3e8a35" />
        <ellipse cx="100" cy="58" rx="22" ry="11" transform="rotate(18 100 58)" fill="#3e8a35" />
        <ellipse cx="56" cy="50" rx="18" ry="13" transform="rotate(-34 56 50)" fill="#4f9d3f" />
        <ellipse cx="86" cy="50" rx="18" ry="13" transform="rotate(34 86 50)" fill="#4f9d3f" />
        <ellipse cx="70" cy="60" rx="20" ry="10" fill="#5aab48" />
        <path d="M70 52 Q66 32 71 14" stroke="#4c8b2f" strokeWidth="3" fill="none" />
        {[[71, 14, 6], [64, 21, 5.5], [77, 22, 5.5], [66, 30, 5], [76, 31, 5], [70, 38, 4.5]].map(([cx, cy, r], index) => <g key={index}>
            <circle cx={cx} cy={cy} r={r} fill={index % 2 ? '#9b72c9' : '#b893dc'} />
            <circle cx={cx} cy={cy} r={r * 0.32} fill="#f2d04b" />
        </g>)}
    </svg>
}

const PETAL = 'M0 0 C16 -14 19 -46 0 -72 C-19 -46 -16 -14 0 0 Z'
export function Lotus({ className = '', style, bud = false }: ArtProps & { bud?: boolean }) {
    const id = safeId(useId())
    return <svg className={'lotus ' + className} style={style} viewBox="0 0 200 200" aria-hidden="true">
        <defs>
            <linearGradient id={`petal-${id}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#fff3f6" />
                <stop offset=".55" stopColor="#f5a2ba" />
                <stop offset="1" stopColor="#de4f7a" />
            </linearGradient>
        </defs>
        <path d="M24 176 a76 20 0 1 0 152 0 a76 20 0 1 0 -152 0 Z" fill="#3f7d34" />
        <path d="M100 176 L172 170" stroke="#2b5e27" strokeWidth="3" />
        <path d="M100 172 Q94 136 100 112" stroke="#4c8b2f" strokeWidth="5" fill="none" />
        <g transform="translate(100 114)">
            {bud
                ? <g><path d={PETAL} fill={`url(#petal-${id})`} transform="scale(.8 1)" /><path d={PETAL} fill={`url(#petal-${id})`} transform="rotate(-14) scale(.6 .9)" opacity=".85" /><path d={PETAL} fill={`url(#petal-${id})`} transform="rotate(14) scale(.6 .9)" opacity=".85" /></g>
                : <g>
                    {[-62, 62, -36, 36].map(angle => <path key={angle} d={PETAL} fill={`url(#petal-${id})`} opacity=".82" transform={`rotate(${angle}) scale(.86)`} />)}
                    <ellipse cx="0" cy="-12" rx="14" ry="7" fill="#f2d04b" />
                    {[-16, 16, 0].map(angle => <path key={angle} d={PETAL} fill={`url(#petal-${id})`} transform={`rotate(${angle}) scale(.92 .86)`} />)}
                </g>}
        </g>
    </svg>
}

export function Stork({ className = '', style }: ArtProps) {
    return <svg className={'stork ' + className} style={style} viewBox="0 0 64 32" aria-hidden="true">
        <g className="stork-wings"><path d="M2 12 Q18 0 32 15 Q46 0 62 12 Q46 9 32 19 Q18 9 2 12 Z" fill="#fffaf0" /></g>
        <path d="M24 16 Q32 13 42 16 L52 14 L56 15 L43 19 Q32 21 24 16 Z" fill="#fffaf0" />
        <path d="M55 15 L62 16" stroke="#e9a23b" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
}

export function Lantern({ className = '', style, color = '#e0452f' }: ArtProps & { color?: string }) {
    const id = safeId(useId())
    return <svg className={'lantern ' + className} style={style} viewBox="0 0 60 130" aria-hidden="true">
        <defs>
            <radialGradient id={`lit-${id}`} cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="#fff2b8" />
                <stop offset=".45" stopColor={color} />
                <stop offset="1" stopColor="#7d1d12" />
            </radialGradient>
        </defs>
        <line x1="30" y1="0" x2="30" y2="24" stroke="#2b1a10" strokeWidth="1.5" />
        <rect x="21" y="22" width="18" height="7" rx="2" fill="#d9a53a" />
        <ellipse cx="30" cy="56" rx="25" ry="28" fill={`url(#lit-${id})`} />
        <path d="M30 28 Q12 56 30 84 M30 28 Q48 56 30 84 M30 28 Q2 56 30 84 M30 28 Q58 56 30 84" stroke="rgba(80,20,10,.35)" strokeWidth="1.2" fill="none" />
        <rect x="21" y="82" width="18" height="7" rx="2" fill="#d9a53a" />
        <path d="M24 89 L22 124 M30 89 L30 128 M36 89 L38 124" stroke="#f2c14e" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
}

export function BrandMark({ className = '' }: { className?: string }) {
    const id = safeId(useId())
    return <svg className={'brand-mark ' + className} viewBox="0 0 40 40" aria-hidden="true">
        <defs><clipPath id={`bm-${id}`}><circle cx="20" cy="20" r="20" /></clipPath></defs>
        <g clipPath={`url(#bm-${id})`}>
            <rect width="40" height="40" fill="#0b3d36" />
            <rect width="40" height="24" fill="#f3a14a" />
            <rect width="40" height="12" fill="#e0567f" opacity=".55" />
            <circle cx="20" cy="24" r="9" fill="#ffe08a" />
            <rect y="24" width="40" height="16" fill="#0b3d36" />
            <path d="M0 29 Q5 27 10 29 T20 29 T30 29 T40 29" stroke="#f6b93b" strokeWidth="1.4" fill="none" opacity=".8" />
            <path d="M8 24 Q12 30 20 30 Q28 30 33 23 L31 27 Q26 33 20 33 Q12 33 8 24 Z" fill="#fbf3e1" />
            <path d="M15 24 L19 19 L23 24 Z" fill="#fbf3e1" />
        </g>
    </svg>
}

const random = (seed: number) => () => (seed = seed * 16807 % 2147483647) / 2147483647

export function Fireflies({ count = 22, seed = 7, className = '' }: { count?: number; seed?: number; className?: string }) {
    const dots = useMemo(() => {
        const next = random(seed)
        return Array.from({ length: count }, () => ({ left: next() * 100, top: next() * 100, size: 2 + next() * 4, drift: 6 + next() * 9, blink: 1.4 + next() * 2.6, delay: -next() * 10 }))
    }, [count, seed])
    return <div className={'fireflies ' + className} aria-hidden="true">
        {dots.map((dot, index) => <span key={index} style={{ left: `${dot.left}%`, top: `${dot.top}%`, width: dot.size, height: dot.size, animationDuration: `${dot.drift}s, ${dot.blink}s`, animationDelay: `${dot.delay}s, ${dot.delay}s` }} />)}
    </div>
}

const wavePath = (amp: number, period: number, base: number) => {
    let d = `M0 ${base}`
    for (let x = 0; x < 1440 + period; x += period) d += ` Q${x + period / 4} ${base - amp} ${x + period / 2} ${base} T${x + period} ${base}`
    return d + ' V120 H0 Z'
}
const WAVES = [wavePath(9, 240, 44), wavePath(7, 320, 62), wavePath(5, 180, 82)]

export function RiverWaves({ className = '' }: { className?: string }) {
    return <svg className={'river-waves ' + className} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="rw rw-1" d={WAVES[0]} />
        <path className="rw rw-2" d={WAVES[1]} />
        <path className="rw rw-3" d={WAVES[2]} />
    </svg>
}
