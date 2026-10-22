import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { resolveImageUrl, uploadImage } from '../services/api'

type Props = {
    name: string
    label: string
    defaultValue?: string | null
    onUploadingChange?: (uploading: boolean) => void
}

/** Chọn ảnh từ thiết bị (tự upload) hoặc dán link ảnh; giá trị được gửi qua input `name` như form thường. */
export default function ImageUploadField({ name, label, defaultValue, onUploadingChange }: Props) {
    const [url, setUrl] = useState(defaultValue ?? '')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInput = useRef<HTMLInputElement>(null)

    const choose = async (file?: File) => {
        if (!file) return
        setError('')
        setUploading(true)
        onUploadingChange?.(true)
        try {
            setUrl(await uploadImage(file))
        } catch (uploadError: any) {
            setError(String(uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh lên.'))
        } finally {
            setUploading(false)
            onUploadingChange?.(false)
            if (fileInput.current) fileInput.current.value = ''
        }
    }

    return <div className="image-upload-field">
        <span className="image-upload-label">{label}</span>
        <div className="image-upload-body">
            <div className="image-upload-preview">
                {uploading ? <Loader2 className="spin" size={22} /> : url ? <img src={resolveImageUrl(url)} alt="Ảnh xem trước" /> : <ImagePlus size={22} />}
            </div>
            <div className="image-upload-controls">
                <div className="image-upload-actions">
                    <button type="button" className="button light" disabled={uploading} onClick={() => fileInput.current?.click()}>
                        <ImagePlus size={16} /> {uploading ? 'Đang tải lên...' : url ? 'Đổi ảnh' : 'Chọn ảnh từ thiết bị'}
                    </button>
                    {url && !uploading && <button type="button" className="icon-btn" aria-label="Bỏ ảnh" onClick={() => setUrl('')}><X size={16} /></button>}
                </div>
                <input name={name} value={url} onChange={event => setUrl(event.target.value)} placeholder="hoặc dán link ảnh https://..." maxLength={500} aria-label={`${label} (đường dẫn)`} />
                <small>JPG, PNG, WEBP hoặc GIF, tối đa 5MB. Ảnh lớn sẽ được tự thu nhỏ.</small>
                {error && <small className="image-upload-error" role="alert">{error}</small>}
            </div>
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={event => void choose(event.target.files?.[0])} />
    </div>
}
