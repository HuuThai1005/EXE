package com.mekongstorybox.controller;

import com.mekongstorybox.entity.Product;
import com.mekongstorybox.entity.Story;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.StoryRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final ProductRepository products;
    private final StoryRepository stories;
    public CatalogController(ProductRepository products, StoryRepository stories) { this.products = products; this.stories = stories; }
    @GetMapping("/products") public Map<String, Object> products() { return Map.of("success", true, "data", products.findAll().stream().map(ProductResponse::from).toList(), "message", "Success"); }
    @GetMapping("/stories") public Map<String, Object> stories(@RequestParam(required = false) String category) { List<Story> result = category == null ? stories.findAll() : stories.findByCategoryIgnoreCaseOrderByCreatedAtDesc(category); return Map.of("success", true, "data", result.stream().map(StoryResponse::from).toList(), "message", "Success"); }

    record ProductResponse(Long id, String name, String slug, String description, BigDecimal price, String thumbnailUrl) { static ProductResponse from(Product item) { return new ProductResponse(item.getId(), item.getName(), item.getSlug(), item.getDescription(), item.getPrice(), item.getThumbnailUrl()); } }
    record StoryResponse(Long id, String slug, String title, String category, Integer readingTime, String coverImage, String summary) { static StoryResponse from(Story item) { return new StoryResponse(item.getId(), item.getSlug(), item.getTitle(), item.getCategory(), item.getReadingTime(), item.getCoverImage(), item.getSummary()); } }
}
