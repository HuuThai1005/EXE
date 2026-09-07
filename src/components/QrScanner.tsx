import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, QrCode } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'

function tokenFromQr(value: string) {
    try {
        const url = new URL(value)
        const match = url.pathname.match(/\/experience\/qr\/([^/]+)/)
        return match?.[1] ?? value
    } catch {
        return value.trim()
    }
}

export default function QrScanner() {
    const navigate = useNavigate()
    const [scanError, setScanError] = useState('')
    useEffect(() => {
        const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
        scanner.render((decodedText) => {
            const token = tokenFromQr(decodedText)
            if (!token) return
            void scanner.clear().finally(() => navigate(`/experience/qr/${encodeURIComponent(token)}`))
        }, () => undefined)
        return () => { void scanner.clear().catch(() => undefined) }
    }, [navigate])
    return <main className="experience scanner-page"><div className="scanner-card"><Link className="scanner-back" to="/experience"><ArrowLeft size={16} /> Quay lại</Link><div className="scanner-icon"><Camera size={28} /></div><p className="eyebrow">MEKONG STORY BOX / SCAN QR</p><h1>Mở khóa<br /><em>hành trình.</em></h1><p>Cho phép camera và đưa mã QR trên thẻ Digital Passport vào khung quét.</p><div id="qr-reader" /><div className="scanner-tip"><QrCode size={16} /><span>Camera chỉ được dùng để đọc mã QR. Token sẽ được xác thực bởi máy chủ.</span></div>{scanError && <p role="alert">{scanError}</p>}<button className="text-button" onClick={() => setScanError('Nếu camera không mở, hãy kiểm tra quyền camera của trình duyệt và dùng HTTPS hoặc localhost.')}>Camera không mở?</button></div></main>
}
