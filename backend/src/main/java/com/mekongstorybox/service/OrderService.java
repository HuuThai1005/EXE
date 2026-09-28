package com.mekongstorybox.service;

import com.mekongstorybox.dto.OrderDtos.CreateOrderRequest;
import com.mekongstorybox.dto.OrderDtos.OrderItemRequest;
import com.mekongstorybox.dto.OrderDtos.OrderHistoryResponse;
import com.mekongstorybox.dto.OrderDtos.OrderItemResponse;
import com.mekongstorybox.dto.OrderDtos.OrderResponse;
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
        passports.getOrCreate(user).addExploration(ORDER_PASSPORT_POINTS);

        return new OrderResponse(order.getOrderCode(), total, ORDER_PASSPORT_POINTS);
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
                order.getId(), order.getOrderCode(), order.getCustomerName(), order.getUser().getEmail(),
                order.getPhone(), order.getShippingAddress(), order.getTotalAmount(), order.getStatus(), order.getCreatedAt()
        )).toList();
    }

    @Transactional
    public AdminOrderResponse updateStatus(Long orderId, String requestedStatus) {
        var order = orders.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng."));
        var nextStatus = requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!isAllowedTransition(order.getStatus(), nextStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái đơn hàng không hợp lệ hoặc không thể chuyển tiếp.");
        }
        if (!order.getStatus().equals(nextStatus)) {
            order.updateStatus(nextStatus);
            statusHistory.save(new CustomerOrderStatusHistory(order, nextStatus, noteForStatus(nextStatus)));
        }
        return new AdminOrderResponse(order.getId(), order.getOrderCode(), order.getCustomerName(), order.getUser().getEmail(),
                order.getPhone(), order.getShippingAddress(), order.getTotalAmount(), order.getStatus(), order.getCreatedAt());
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
            return new OrderHistoryResponse(order.getId(), order.getOrderCode(), order.getStatus(), order.getTotalAmount(), order.getCreatedAt(), items, history);
        }).toList();
    }

    private boolean isAllowedTransition(String currentStatus, String nextStatus) {
        var flow = List.of("PLACED", "PROCESSING", "SHIPPED", "DELIVERED");
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