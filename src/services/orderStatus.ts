export type OrderStatus = 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export const orderStatusLabels: Record<OrderStatus, string> = {
    PLACED: 'Đã tiếp nhận',
    PROCESSING: 'Đang chuẩn bị',
    SHIPPED: 'Đang vận chuyển',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
}

export const orderProgressSteps: { status: Exclude<OrderStatus, 'CANCELLED'>; label: string }[] = [
    { status: 'PLACED', label: 'Tiếp nhận' },
    { status: 'PROCESSING', label: 'Chuẩn bị' },
    { status: 'SHIPPED', label: 'Vận chuyển' },
    { status: 'DELIVERED', label: 'Đã giao' },
]