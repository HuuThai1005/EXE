package com.mekongstorybox.controller;

import com.mekongstorybox.entity.Product;
import com.mekongstorybox.entity.Story;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.StoryRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final ProductRepository products;
    private final StoryRepository stories;
    public CatalogController(ProductRepository products, StoryRepository stories) { this.products = products; this.stories = stories; }
    @GetMapping("/products")
    public Map<String, Object> products(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        var result = products.findAll(PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return Map.of(
                "success", true,
                "data", result.getContent().stream().map(ProductResponse::from).toList(),
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalPages", result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "message", "Success");
    }
    @GetMapping("/products/all")
    public Map<String, Object> allProducts() {
        var result = products.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return Map.of(
                "success", true,
                "data", result.stream().map(ProductResponse::from).toList(),
                "message", "Success");
    }
    @GetMapping("/products/redeemable")
    public Map<String, Object> redeemableProducts() {
        var result = products.findByStatusOrderByCreatedAtDesc("ACTIVE");
        return Map.of("success", true, "data", result.stream().map(ProductResponse::from).toList(), "message", "Success");
    }
    @GetMapping("/stories") public Map<String, Object> stories(@RequestParam(required = false) String category) { List<Story> result = category == null ? stories.findAll() : stories.findByCategoryIgnoreCaseOrderByCreatedAtDesc(category); return Map.of("success", true, "data", result.stream().map(StoryResponse::from).toList(), "message", "Success"); }

    record ProductResponse(Long id, String name, String slug, String description, BigDecimal price, String thumbnailUrl) { static ProductResponse from(Product item) { return new ProductResponse(item.getId(), item.getName(), item.getSlug(), item.getDescription(), item.getPrice(), item.getThumbnailUrl()); } }
    record StoryResponse(Long id, String slug, String title, String category, Integer readingTime, String coverImage, String summary) { static StoryResponse from(Story item) { return new StoryResponse(item.getId(), item.getSlug(), item.getTitle(), item.getCategory(), item.getReadingTime(), item.getCoverImage(), item.getSummary()); } }
}
