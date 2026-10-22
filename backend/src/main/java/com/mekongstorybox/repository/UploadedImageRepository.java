package com.mekongstorybox.repository;

import com.mekongstorybox.entity.UploadedImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UploadedImageRepository extends JpaRepository<UploadedImage, UUID> {
}
