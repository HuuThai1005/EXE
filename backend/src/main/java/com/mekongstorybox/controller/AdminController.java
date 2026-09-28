package com.mekongstorybox.controller;

import com.mekongstorybox.entity.Product;
import com.mekongstorybox.entity.QrToken;
import com.mekongstorybox.entity.Story;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.QrTokenRepository;
import com.mekongstorybox.repository.StoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ProductRepository products;
    private final StoryRepository stories;
    private final QrTokenRepository qrTokens;

    public AdminController(ProductRepository products, StoryRepository stories, QrTokenRepository qrTokens) {
        this.products = products;
        this.stories = stories;
        this.qrTokens = qrTokens;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return Map.of("products", products.count(), "stories", stories.count(), "qrTokens", qrTokens.count(), "activeQrTokens", qrTokens.findAll().stream().filter(qr -> "ACTIVE".equals(qr.getStatus())).count());
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
        product.setThumbnailUrl(request.thumbnailUrl());
        product.setStatus("ACTIVE");
        return Map.of("success", true, "data", products.save(product).getId());
    }

    @PostMapping("/stories")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createStory(@Valid @RequestBody StoryRequest request) {
        var story = new Story();
        story.setTitle(request.title().trim());
        story.setSlug(request.slug().trim().toLowerCase());
        story.setSummary(request.summary());
        story.setCategory(request.category().trim().toUpperCase());
        story.setCoverImage(request.coverImage());
        story.setReadingTime(request.readingTime());
        return Map.of("success", true, "data", stories.save(story).getId());
    }

    @PostMapping("/qr-tokens")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createQrToken(@Valid @RequestBody QrRequest request) {
        var token = request.token().trim();
        if (qrTokens.findByToken(token).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã QR đã tồn tại. Hãy chọn token khác.");
        }
        var product = products.findById(request.productId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy sản phẩm với ID đã nhập."));
        var qr = new QrToken();
        qr.setToken(token);
        qr.setStatus("ACTIVE");
        qr.setProduct(product);
        return Map.of("success", true, "data", qrTokens.save(qr).getId());
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
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setThumbnailUrl(request.thumbnailUrl());
        return Map.of("success", true, "data", products.save(product).getId());
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        if (!products.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        if (qrTokens.findAll().stream().anyMatch(qr -> qr.getProduct() != null && id.equals(qr.getProduct().getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa sản phẩm đang được liên kết với mã QR.");
        }
        products.deleteById(id);
    }

    @GetMapping("/stories")
    public Map<String, Object> listStories() {
        return Map.of("success", true, "data", stories.findAll().stream().map(StoryAdminResponse::from).toList());
    }

    @PutMapping("/stories/{id}")
    public Map<String, Object> updateStory(@PathVariable Long id, @Valid @RequestBody StoryRequest request) {
        var story = stories.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        story.setTitle(request.title().trim());
        story.setSlug(request.slug().trim().toLowerCase());
        story.setSummary(request.summary());
        story.setCategory(request.category().trim().toUpperCase());
        story.setCoverImage(request.coverImage());
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

    public record ProductRequest(@NotBlank String name, @NotBlank String slug, String description, @NotNull @Positive BigDecimal price, String thumbnailUrl) {}
    public record StoryRequest(@NotBlank String title, @NotBlank String slug, String summary, @NotBlank String category, String coverImage, @NotNull @Positive Integer readingTime) {}
    public record QrRequest(@NotBlank String token, @NotNull Long productId) {}
    record ProductAdminResponse(Long id, String name, String slug, String description, BigDecimal price, String thumbnailUrl, String status) { static ProductAdminResponse from(Product item) { return new ProductAdminResponse(item.getId(), item.getName(), item.getSlug(), item.getDescription(), item.getPrice(), item.getThumbnailUrl(), item.getStatus()); } }
    record StoryAdminResponse(Long id, String title, String slug, String summary, String category, String coverImage, Integer readingTime) { static StoryAdminResponse from(Story item) { return new StoryAdminResponse(item.getId(), item.getTitle(), item.getSlug(), item.getSummary(), item.getCategory(), item.getCoverImage(), item.getReadingTime()); } }
    record QrAdminResponse(Long id, String token, String status, Long productId, String productName) { static QrAdminResponse from(QrToken item) { var product = item.getProduct(); return new QrAdminResponse(item.getId(), item.getToken(), item.getStatus(), product == null ? null : product.getId(), product == null ? null : product.getName()); } }
}