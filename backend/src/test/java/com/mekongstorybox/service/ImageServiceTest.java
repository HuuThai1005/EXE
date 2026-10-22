package com.mekongstorybox.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ImageServiceTest {
    private static byte[] bytes(int... values) {
        var result = new byte[values.length];
        for (int i = 0; i < values.length; i++) result[i] = (byte) values[i];
        return result;
    }

    @Test
    void detectsSupportedImageTypesFromContent() {
        assertEquals(Optional.of("image/jpeg"), ImageService.detectImageType(bytes(0xFF, 0xD8, 0xFF, 0xE0, 0, 0)));
        assertEquals(Optional.of("image/png"), ImageService.detectImageType(bytes(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0)));
        assertEquals(Optional.of("image/gif"), ImageService.detectImageType("GIF89a....".getBytes(StandardCharsets.US_ASCII)));
        assertEquals(Optional.of("image/webp"), ImageService.detectImageType("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.US_ASCII)));
    }

    @Test
    void rejectsSvgHtmlAndTruncatedFiles() {
        assertEquals(Optional.empty(), ImageService.detectImageType("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8)));
        assertEquals(Optional.empty(), ImageService.detectImageType("<html><script>".getBytes(StandardCharsets.UTF_8)));
        assertEquals(Optional.empty(), ImageService.detectImageType("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.US_ASCII)));
        assertEquals(Optional.empty(), ImageService.detectImageType(bytes(0xFF, 0xD8)));
        assertEquals(Optional.empty(), ImageService.detectImageType(new byte[0]));
    }
}
