import { useEffect, useRef } from 'react'

type GoogleIdentity = {
    initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void
    renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const googleSignInEnabled = Boolean(CLIENT_ID)

// Google chỉ cho initialize một lần mỗi trang, nên callback chuyển tiếp tới nút đang hiển thị
let activeHandler: ((credential: string) => void) | undefined
let googleReady: Promise<GoogleIdentity> | undefined

function loadGoogleIdentity() {
    googleReady ??= new Promise<GoogleIdentity>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = () => {
            const identity = window.google!.accounts.id
            identity.initialize({ client_id: CLIENT_ID!, callback: response => activeHandler?.(response.credential) })
            resolve(identity)
        }
        script.onerror = () => { googleReady = undefined; script.remove(); reject(new Error('Không tải được Google Sign-In.')) }
        document.head.appendChild(script)
    })
    return googleReady
}

/** Nút "Đăng nhập bằng Google" (Google Identity Services). Trả về ID token qua onCredential; ẩn khi chưa cấu hình VITE_GOOGLE_CLIENT_ID. */
export default function GoogleSignInButton({ text, onCredential, onError }: { text: 'signin_with' | 'signup_with'; onCredential: (credential: string) => void; onError: (message: string) => void }) {
    const container = useRef<HTMLDivElement>(null)
    const handlers = useRef({ onCredential, onError })
    handlers.current = { onCredential, onError }

    useEffect(() => {
        if (!CLIENT_ID) return
        let cancelled = false
        const handler = (credential: string) => handlers.current.onCredential(credential)
        activeHandler = handler
        loadGoogleIdentity().then(identity => {
            if (cancelled || !container.current) return
            container.current.replaceChildren()
            identity.renderButton(container.current, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text, locale: 'vi', width: Math.min(400, container.current.offsetWidth) })
        }).catch(() => { if (!cancelled) handlers.current.onError('Không tải được đăng nhập Google. Kiểm tra kết nối mạng rồi tải lại trang.') })
        return () => { cancelled = true; if (activeHandler === handler) activeHandler = undefined }
    }, [text])

    if (!CLIENT_ID) return null
    return <div className="google-signin" ref={container} />
}
