package com.mekongstorybox.controller;

import com.mekongstorybox.entity.Product;
import com.mekongstorybox.entity.QrToken;
import com.mekongstorybox.entity.Story;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.QrScanRepository;
import com.mekongstorybox.repository.QrTokenRepository;
import com.mekongstorybox.repository.StoryRepository;
import com.mekongstorybox.service.ImageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ProductRepository products;
    private final StoryRepository stories;
    private final QrTokenRepository qrTokens;
    private final QrScanRepository qrScans;
    private final ImageService images;

    public AdminController(ProductRepository products, StoryRepository stories, QrTokenRepository qrTokens, QrScanRepository qrScans, ImageService images) {
        this.products = products;
        this.stories = stories;
        this.qrTokens = qrTokens;
        this.qrScans = qrScans;
        this.images = images;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return Map.of("products", products.count(), "stories", stories.count(), "qrTokens", qrTokens.count(), "activeQrTokens", qrTokens.countByStatus(QrToken.ACTIVE));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createProduct(@Valid @RequestBody ProductRequest request) {
        var slug = request.slug().trim().toLowerCase();
        if (products.existsBySlugIgnoreCase(slug)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug sản phẩm đã tồn tại. Hãy chọn slug khác.");
        var product = new Product();
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setThumbnailUrl(blankToNull(request.thumbnailUrl()));
        product.setStatus("ACTIVE");
        return Map.of("success", true, "data", products.save(product).getId());
    }

    @PostMapping("/stories")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createStory(@Valid @RequestBody StoryRequest request) {
        var slug = request.slug().trim().toLowerCase();
        if (stories.existsBySlugIgnoreCase(slug)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug story đã tồn tại. Hãy chọn slug khác.");
        var story = new Story();
        story.setTitle(request.title().trim());
        story.setSlug(slug);
        story.setSummary(request.summary());
        story.setCategory(request.category().trim().toUpperCase());
        story.setCoverImage(blankToNull(request.coverImage()));
        story.setReadingTime(request.readingTime());
        return Map.of("success", true, "data", stories.save(story).getId());
    }

    /** Phát hành một lô mã QR dùng một lần cho sản phẩm (mỗi hộp in một mã). Token do server sinh ngẫu nhiên nên không đoán được. */
    @PostMapping("/qr-tokens")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createQrTokens(@Valid @RequestBody QrRequest request) {
        var product = products.findById(request.productId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy sản phẩm với ID đã nhập."));
        var batch = new ArrayList<QrToken>();
        for (int i = 0; i < request.quantity(); i++) {
            var qr = new QrToken();
            qr.setToken(randomQrToken());
            qr.setStatus(QrToken.ACTIVE);
            qr.setProduct(product);
            batch.add(qr);
        }
        return Map.of("success", true, "data", qrTokens.saveAll(batch).stream().map(QrAdminResponse::from).toList());
    }

    /** 128 bit ngẫu nhiên, mã hóa base64url (22 ký tự) để nằm gọn trong QR và URL. */
    static String randomQrToken() {
        var bytes = new byte[16];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @GetMapping("/products")
    public Map<String, Object> listProducts() {
        return Map.of("success", true, "data", products.findAll().stream().map(ProductAdminResponse::from).toList());
    }

    @PutMapping("/products/{id}")
    public Map<String, Object> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        var product = products.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        var slug = request.slug().trim().toLowerCase();
        if (!product.getSlug().equalsIgnoreCase(slug) && products.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug sản phẩm đã tồn tại.");
        }
        var previousThumbnail = product.getThumbnailUrl();
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setThumbnailUrl(blankToNull(request.thumbnailUrl()));
        var savedId = products.save(product).getId();
        if (previousThumbnail != null && !previousThumbnail.equals(product.getThumbnailUrl())) images.deleteIfUnused(previousThumbnail);
        return Map.of("success", true, "data", savedId);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        var product = products.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        long linkedQrCodes = qrTokens.countByProduct_Id(id);
        if (linkedQrCodes > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sản phẩm đang liên kết với " + linkedQrCodes + " mã QR. Hãy xóa các mã QR này trong mục Quản lý mã QR trước.");
        }
        products.delete(product);
        images.deleteIfUnused(product.getThumbnailUrl());
    }

    @GetMapping("/stories")
    public Map<String, Object> listStories() {
        return Map.of("success", true, "data", stories.findAll().stream().map(StoryAdminResponse::from).toList());
    }

    @PutMapping("/stories/{id}")
    public Map<String, Object> updateStory(@PathVariable Long id, @Valid @RequestBody StoryRequest request) {
        var story = stories.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        var slug = request.slug().trim().toLowerCase();
        if (!story.getSlug().equalsIgnoreCase(slug) && stories.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug story đã tồn tại.");
        }
        story.setTitle(request.title().trim());
        story.setSlug(slug);
        story.setSummary(request.summary());
        story.setCategory(request.category().trim().toUpperCase());
        story.setCoverImage(blankToNull(request.coverImage()));
        story.setReadingTime(request.readingTime());
        return Map.of("success", true, "data", stories.save(story).getId());
    }

    @DeleteMapping("/stories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStory(@PathVariable Long id) {
        if (!stories.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found");
        stories.deleteById(id);
    }

    @GetMapping("/qr-tokens")
    public Map<String, Object> listQrTokens() {
        return Map.of("success", true, "data", qrTokens.findAllWithProducts().stream().map(QrAdminResponse::from).toList());
    }

    /** Thu hồi mã chưa quét (vd. bao bì in lỗi, thất lạc): mã chuyển REVOKED, không quét được nữa nhưng vẫn giữ lịch sử. */
    @PostMapping("/qr-tokens/{id}/revoke")
    @Transactional
    public Map<String, Object> revokeQrToken(@PathVariable Long id) {
        if (qrTokens.revokeIfActive(id) == 0) {
            if (!qrTokens.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mã QR.");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ thu hồi được mã chưa được quét.");
        }
        return Map.of("success", true, "data", id);
    }

    /** Xóa mã QR cùng lịch sử quét của nó. Điểm passport người dùng đã nhận được giữ nguyên. */
    @DeleteMapping("/qr-tokens/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteQrToken(@PathVariable Long id) {
        if (!qrTokens.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mã QR.");
        qrScans.deleteAllByQrTokenId(id);
        qrTokens.deleteById(id);
    }

    // Giới hạn khớp với độ dài cột trong DB để lỗi được trả về 400 thay vì 500 từ PostgreSQL
    static final String SLUG_PATTERN = "^\\s*[A-Za-z0-9]+(-[A-Za-z0-9]+)*\\s*$";
    static final String SLUG_MESSAGE = "chỉ gồm chữ không dấu, số và dấu gạch ngang (vd. ben-tre-002)";
    // Chỉ cho phép link http(s) hoặc ảnh đã upload (/api/images/{id}) để chặn javascript:/data: URL (stored XSS)
    static final String HTTP_URL_PATTERN = "^\\s*(https?://\\S+|/api/images/[0-9a-fA-F-]{36})?\\s*$";
    static final String HTTP_URL_MESSAGE = "phải là ảnh đã tải lên hoặc đường dẫn bắt đầu bằng http:// hoặc https://";
    static final int MAX_QR_BATCH = 200;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public record ProductRequest(@NotBlank @Size(max = 255) String name,
                                 @NotBlank @Size(max = 255) @Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) String slug,
                                 @Size(max = 10000) String description,
                                 @NotNull @Positive @Digits(integer = 16, fraction = 2) BigDecimal price,
                                 @Size(max = 500) @Pattern(regexp = HTTP_URL_PATTERN, message = HTTP_URL_MESSAGE) String thumbnailUrl) {}
    public record StoryRequest(@NotBlank @Size(max = 255) String title,
                               @NotBlank @Size(max = 255) @Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) String slug,
                               @Size(max = 1000) String summary,
                               @NotBlank @Size(max = 50) String category,
                               @Size(max = 500) @Pattern(regexp = HTTP_URL_PATTERN, message = HTTP_URL_MESSAGE) String coverImage,
                               @NotNull @Positive @Max(600) Integer readingTime) {}
    public record QrRequest(@NotNull @Positive Long productId,
                            @NotNull @Min(1) @Max(MAX_QR_BATCH) Integer quantity) {}
    record ProductAdminResponse(Long id, String name, String slug, String description, BigDecimal price, String thumbnailUrl, String status) { static ProductAdminResponse from(Product item) { return new ProductAdminResponse(item.getId(), item.getName(), item.getSlug(), item.getDescription(), item.getPrice(), item.getThumbnailUrl(), item.getStatus()); } }
    record StoryAdminResponse(Long id, String title, String slug, String summary, String category, String coverImage, Integer readingTime) { static StoryAdminResponse from(Story item) { return new StoryAdminResponse(item.getId(), item.getTitle(), item.getSlug(), item.getSummary(), item.getCategory(), item.getCoverImage(), item.getReadingTime()); } }
    record QrAdminResponse(Long id, String token, String status, LocalDateTime usedAt, Long productId, String productName) { static QrAdminResponse from(QrToken item) { var product = item.getProduct(); return new QrAdminResponse(item.getId(), item.getToken(), item.getStatus(), item.getUsedAt(), product == null ? null : product.getId(), product == null ? null : product.getName()); } }
}