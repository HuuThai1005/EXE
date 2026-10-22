package com.mekongstorybox.controller;

import com.mekongstorybox.service.ImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ImageController {
    private final ImageService images;

    public ImageController(ImageService images) { this.images = images; }

    /** Upload ảnh (chỉ ADMIN, do SecurityConfig chặn /api/admin/**). */
    @PostMapping(path = "/admin/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) {
        return Map.of("success", true, "data", Map.of("url", images.store(file)), "message", "Image uploaded");
    }

    @GetMapping("/images/{id}")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        return images.find(id)
                .map(image -> ResponseEntity.ok()
                        // id ngẫu nhiên và nội dung không bao giờ đổi -> cho trình duyệt/CDN cache lâu
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .body(image.getData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
