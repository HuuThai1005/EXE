package com.mekongstorybox.service;

import com.mekongstorybox.entity.UploadedImage;
import com.mekongstorybox.repository.ProductRepository;
import com.mekongstorybox.repository.StoryRepository;
import com.mekongstorybox.repository.UploadedImageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ImageService {
    public static final String PUBLIC_PATH = "/api/images/";
    public static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Pattern INTERNAL_URL = Pattern.compile("^" + Pattern.quote(PUBLIC_PATH) + "([0-9a-fA-F-]{36})$");

    private final UploadedImageRepository images;
    private final ProductRepository products;
    private final StoryRepository stories;

    public ImageService(UploadedImageRepository images, ProductRepository products, StoryRepository stories) {
        this.images = images;
        this.products = products;
        this.stories = stories;
    }

    /** Lưu ảnh và trả về đường dẫn công khai dạng /api/images/{id}. */
    @Transactional
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn một file ảnh.");
        if (file.getSize() > MAX_IMAGE_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh tối đa 5MB.");
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được file ảnh.");
        }
        // Xác định loại ảnh theo nội dung file (magic bytes), không tin Content-Type/đuôi file do client gửi.
        // SVG bị từ chối vì có thể chứa JavaScript.
        var contentType = detectImageType(data)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF."));
        return PUBLIC_PATH + images.save(new UploadedImage(contentType, data)).getId();
    }

    @Transactional(readOnly = true)
    public Optional<UploadedImage> find(UUID id) {
        return images.findById(id);
    }

    /** Xóa ảnh đã upload nếu không còn sản phẩm/story nào dùng (gọi sau khi đổi ảnh hoặc xóa sản phẩm). */
    @Transactional
    public void deleteIfUnused(String url) {
        if (url == null) return;
        var matcher = INTERNAL_URL.matcher(url.trim());
        if (!matcher.matches()) return;
        if (products.existsByThumbnailUrl(url) || stories.existsByCoverImage(url)) return;
        images.deleteById(UUID.fromString(matcher.group(1)));
    }

    static Optional<String> detectImageType(byte[] data) {
        if (startsWith(data, 0, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) return Optional.of("image/jpeg");
        if (startsWith(data, 0, new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) return Optional.of("image/png");
        if (startsWith(data, 0, ascii("GIF87a")) || startsWith(data, 0, ascii("GIF89a"))) return Optional.of("image/gif");
        if (startsWith(data, 0, ascii("RIFF")) && startsWith(data, 8, ascii("WEBP"))) return Optional.of("image/webp");
        return Optional.empty();
    }

    private static byte[] ascii(String value) { return value.getBytes(StandardCharsets.US_ASCII); }

    private static boolean startsWith(byte[] data, int offset, byte[] prefix) {
        return data.length >= offset + prefix.length && Arrays.equals(data, offset, offset + prefix.length, prefix, 0, prefix.length);
    }
}
