package com.mekongstorybox.service;

import com.mekongstorybox.dto.OrderDtos.CreateOrderRequest;
import com.mekongstorybox.dto.OrderDtos.OrderItemRequest;
import com.mekongstorybox.dto.OrderDtos.OrderHistoryResponse;
import com.mekongstorybox.dto.OrderDtos.OrderItemResponse;
import com.mekongstorybox.dto.OrderDtos.OrderResponse;
import com.mekongstorybox.dto.OrderDtos.RedemptionResponse;
import com.mekongstorybox.dto.OrderDtos.RedeemProductRequest;
import com.mekongstorybox.dto.OrderDtos.OrderStatusEventResponse;
import com.mekongstorybox.dto.OrderDtos.AdminOrderResponse;
import com.mekongstorybox.entity.CustomerOrder;
import com.mekongstorybox.entity.CustomerOrderStatusHistory;
import com.mekongstorybox.entity.Product;
import com.mekongstorybox.repository.CustomerOrderRepository;
import com.mekongstorybox.repository.CustomerOrderStatusHistoryRepository;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private static final int ORDER_PASSPORT_POINTS = 100;
    private static final int REWARD_REDEMPTION_POINTS = 500;

    private final CustomerOrderRepository orders;
    private final CustomerOrderStatusHistoryRepository statusHistory;
    private final ProductRepository products;
    private final UserRepository users;
    private final PassportService passports;

    public OrderService(CustomerOrderRepository orders, CustomerOrderStatusHistoryRepository statusHistory, ProductRepository products, UserRepository users, PassportService passports) {
        this.orders = orders;
        this.statusHistory = statusHistory;
        this.products = products;
        this.users = users;
        this.passports = passports;
    }

    @Transactional
    public OrderResponse placeOrder(String email, CreateOrderRequest request) {
        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đặt hàng."));
        var requestedItems = request.items();
        var productIds = requestedItems.stream().map(OrderItemRequest::productId).toList();
        if (new HashSet<>(productIds).size() != productIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi sản phẩm chỉ được xuất hiện một lần trong đơn hàng.");
        }

        Map<Long, Product> productsById = products.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        if (productsById.size() != productIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một hoặc nhiều sản phẩm không còn tồn tại.");
        }

        var order = new CustomerOrder(user, createOrderCode(), request.customerName().trim(), request.phone().trim(), request.shippingAddress().trim());
        var total = BigDecimal.ZERO;
        for (var item : requestedItems) {
            var product = productsById.get(item.productId());
            if (!"ACTIVE".equals(product.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm " + product.getName() + " hiện không thể đặt hàng.");
            }
            order.addItem(product, item.quantity());
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }
        order.setTotalAmount(total);
        orders.save(order);
        statusHistory.save(new CustomerOrderStatusHistory(order, "PLACED", "Đơn hàng đã được tiếp nhận."));
        passports.addExploration(user, ORDER_PASSPORT_POINTS);

        return new OrderResponse(order.getOrderCode(), total, ORDER_PASSPORT_POINTS);
    }

    @Transactional
    public RedemptionResponse redeemProduct(String email, RedeemProductRequest request) {
        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đổi quà."));
        var product = products.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm."));
        if (!"ACTIVE".equals(product.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm này hiện không thể đổi.");
        }

        passports.spendForReward(user, REWARD_REDEMPTION_POINTS);
        var order = new CustomerOrder(user, createOrderCode(), request.customerName().trim(),
                request.phone().trim(), request.shippingAddress().trim(), REWARD_REDEMPTION_POINTS);
        order.addRewardItem(product);
        order.setTotalAmount(BigDecimal.ZERO);
        orders.save(order);
        statusHistory.save(new CustomerOrderStatusHistory(order, "PLACED", "Đổi quà thành công, đơn hàng đang chờ xử lý."));

        return new RedemptionResponse(order.getOrderCode(), REWARD_REDEMPTION_POINTS, product.getName());
    }

    @Transactional(readOnly = true)
    public List<OrderHistoryResponse> listMyOrders(String email) {
        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập."));
        return toOrderHistory(orders.findAllByUser_IdOrderByCreatedAtDesc(user.getId()));
    }

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> listAllOrders() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(order -> new AdminOrderResponse(
            order.getId(), order.getOrderCode(), order.getOrderType(), order.getCustomerName(), order.getUser().getEmail(),
                order.getPhone(), order.getShippingAddress(), order.getShippingCarrier(), order.getTrackingNumber(),
                order.getTotalAmount(), order.getStatus(), order.getCreatedAt()
        )).toList();
    }

    @Transactional
    public AdminOrderResponse updateStatus(Long orderId, String requestedStatus, String shippingCarrier, String trackingNumber) {
        var order = orders.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng."));
        var nextStatus = requestedStatus.trim().toUpperCase(Locale.ROOT);
        if ("SHIPPED".equals(nextStatus)
                && (shippingCarrier == null || shippingCarrier.isBlank() || trackingNumber == null || trackingNumber.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nhập đơn vị vận chuyển và mã vận đơn.");
        }
        if (!isAllowedTransition(order.getStatus(), nextStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái đơn hàng không hợp lệ hoặc không thể chuyển tiếp.");
        }
        if (!order.getStatus().equals(nextStatus)) {
            if ("SHIPPED".equals(nextStatus)) {
                order.updateShipping(shippingCarrier.trim(), trackingNumber.trim());
            }
            order.updateStatus(nextStatus);
            var note = "SHIPPED".equals(nextStatus)
                    ? noteForStatus(nextStatus) + " " + order.getShippingCarrier() + " · Mã vận đơn: " + order.getTrackingNumber()
                    : noteForStatus(nextStatus);
            statusHistory.save(new CustomerOrderStatusHistory(order, nextStatus, note));
            if ("CANCELLED".equals(nextStatus) && "REDEMPTION".equals(order.getOrderType())) {
                passports.refundPoints(order.getUser(), order.getPassportPointsSpent());
            }
        }
        return toAdminOrder(order);
    }

    @Transactional
    public OrderHistoryResponse confirmReceived(String email, Long orderId) {
        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập."));
        var order = orders.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng."));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
        }
        if (!"SHIPPED".equals(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể xác nhận nhận hàng khi đơn đang vận chuyển.");
        }
        order.updateStatus("DELIVERED");
        statusHistory.save(new CustomerOrderStatusHistory(order, "DELIVERED", "Khách hàng xác nhận đã nhận hàng."));
        return toOrderHistory(List.of(order)).getFirst();
    }

    private AdminOrderResponse toAdminOrder(CustomerOrder order) {
        return new AdminOrderResponse(order.getId(), order.getOrderCode(), order.getOrderType(), order.getCustomerName(),
                order.getUser().getEmail(), order.getPhone(), order.getShippingAddress(), order.getShippingCarrier(),
                order.getTrackingNumber(), order.getTotalAmount(), order.getStatus(), order.getCreatedAt());
    }

    private List<OrderHistoryResponse> toOrderHistory(List<CustomerOrder> customerOrders) {
        if (customerOrders.isEmpty()) return List.of();
        var orderIds = customerOrders.stream().map(CustomerOrder::getId).toList();
        var eventsByOrder = statusHistory.findAllByOrder_IdInOrderByCreatedAtAsc(orderIds).stream()
                .collect(Collectors.groupingBy(CustomerOrderStatusHistory::getOrderId));
        return customerOrders.stream().map(order -> {
            var events = eventsByOrder.getOrDefault(order.getId(), List.of()).stream()
                    .map(event -> new OrderStatusEventResponse(event.getStatus(), event.getNote(), event.getCreatedAt())).toList();
            var history = events.isEmpty()
                    ? List.of(new OrderStatusEventResponse(order.getStatus(), noteForStatus(order.getStatus()), order.getCreatedAt()))
                    : events;
            var items = order.getItems().stream()
                    .map(item -> new OrderItemResponse(item.getProductName(), item.getUnitPrice(), item.getQuantity())).toList();
                return new OrderHistoryResponse(order.getId(), order.getOrderCode(), order.getOrderType(), order.getPassportPointsSpent(),
                    order.getStatus(), order.getShippingCarrier(), order.getTrackingNumber(), order.getTotalAmount(), order.getCreatedAt(), items, history);
        }).toList();
    }

    private boolean isAllowedTransition(String currentStatus, String nextStatus) {
        var flow = List.of("PLACED", "PROCESSING", "SHIPPED");
        if (currentStatus.equals(nextStatus)) return true;
        if ("CANCELLED".equals(nextStatus)) return Set.of("PLACED", "PROCESSING").contains(currentStatus);
        int currentIndex = flow.indexOf(currentStatus);
        return currentIndex >= 0 && currentIndex < flow.size() - 1 && flow.get(currentIndex + 1).equals(nextStatus);
    }

    private String noteForStatus(String status) {
        return switch (status) {
            case "PLACED" -> "Đơn hàng đã được tiếp nhận.";
            case "PROCESSING" -> "Đơn hàng đang được chuẩn bị.";
            case "SHIPPED" -> "Đơn hàng đã được bàn giao cho đơn vị vận chuyển.";
            case "DELIVERED" -> "Đơn hàng đã được giao thành công.";
            case "CANCELLED" -> "Đơn hàng đã bị hủy.";
            default -> "Trạng thái đơn hàng đã được cập nhật.";
        };
    }

    private String createOrderCode() {
        return "MSB-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }
}