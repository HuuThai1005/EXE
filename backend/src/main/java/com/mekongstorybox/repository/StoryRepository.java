package com.mekongstorybox.repository;

import com.mekongstorybox.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category);
}
