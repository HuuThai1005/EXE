import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Palm, RiverWaves, Stork } from './Motifs'

const ease = [0.16, 1, 0.3, 1] as const
const rise = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }

/** Đầu trang con: bình minh sau rặng dừa, cò bay ngang và sóng nước vỗ vào nội dung. */
export default function PageHero({ eyebrow, title, children, compact = false }: { eyebrow: string; title: ReactNode; children?: ReactNode; compact?: boolean }) {
    return <div className={'page-hero' + (compact ? ' compact' : '')}>
        <div className="ph-sun" aria-hidden="true" />
        <div className="ph-birds" aria-hidden="true">{[0, 1, 2].map(i => <div className="rh-bird" key={i} style={{ ['--i' as string]: i }}><Stork /></div>)}</div>
        <motion.div className="ph-palm left" aria-hidden="true" initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease }}><Palm leaf="#7ea862" leafDark="#5f8c4b" trunk="#9a7650" /></motion.div>
        <motion.div className="ph-palm right" aria-hidden="true" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease, delay: 0.1 }}><Palm leaf="#7ea862" leafDark="#5f8c4b" trunk="#9a7650" /></motion.div>
        <motion.div className="ph-content" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.p variants={rise} className="eyebrow">{eyebrow}</motion.p>
            <motion.h1 variants={rise}>{title}</motion.h1>
            {children && <motion.p variants={rise} className="ph-lead">{children}</motion.p>}
        </motion.div>
        <RiverWaves className="ph-waves" />
    </div>
}
