package com.mekongstorybox.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Chặn request body quá lớn (JSON hàng trăm MB) để không làm cạn RAM/CPU của server.
 * Kiểm tra cả Content-Length lẫn body gửi kiểu chunked (không có Content-Length).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RequestSizeLimitFilter extends OncePerRequestFilter {
    private static final String UPLOAD_PATH = "/api/admin/images";

    private final long maxBodyBytes;
    private final long maxUploadBytes;

    public RequestSizeLimitFilter(@Value("${app.max-request-body-bytes:65536}") long maxBodyBytes,
                                  @Value("${app.max-upload-request-bytes:6291456}") long maxUploadBytes) {
        this.maxBodyBytes = maxBodyBytes;
        this.maxUploadBytes = maxUploadBytes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        // Upload ảnh được phép lớn hơn; phần multipart do spring.servlet.multipart.* giới hạn
        if (UPLOAD_PATH.equals(request.getRequestURI())) {
            if (request.getContentLengthLong() > maxUploadBytes) {
                writeTooLarge(response, "Ảnh tối đa 5MB.");
                return;
            }
            chain.doFilter(request, response);
            return;
        }
        if (request.getContentLengthLong() > maxBodyBytes) {
            writeTooLarge(response, "Dữ liệu gửi lên quá lớn.");
            return;
        }
        chain.doFilter(new LimitedRequest(request, maxBodyBytes), response);
    }

    private static void writeTooLarge(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"data\":null,\"status\":413,\"message\":\"" + message + "\"}");
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {
        private final long maxBytes;
        private ServletInputStream stream;

        LimitedRequest(HttpServletRequest request, long maxBytes) {
            super(request);
            this.maxBytes = maxBytes;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (stream == null) stream = new LimitedInputStream(super.getInputStream(), maxBytes);
            return stream;
        }
    }

    private static final class LimitedInputStream extends ServletInputStream {
        private final ServletInputStream delegate;
        private final long maxBytes;
        private long read;

        LimitedInputStream(ServletInputStream delegate, long maxBytes) {
            this.delegate = delegate;
            this.maxBytes = maxBytes;
        }

        @Override
        public int read() throws IOException {
            int value = delegate.read();
            if (value != -1) count(1);
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            int count = delegate.read(buffer, offset, length);
            if (count > 0) count(count);
            return count;
        }

        private void count(int bytes) throws IOException {
            read += bytes;
            if (read > maxBytes) throw new IOException("Request body exceeds " + maxBytes + " bytes");
        }

        @Override public boolean isFinished() { return delegate.isFinished(); }
        @Override public boolean isReady() { return delegate.isReady(); }
        @Override public void setReadListener(ReadListener listener) { delegate.setReadListener(listener); }
    }
}
