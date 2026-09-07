package com.mekongstorybox.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "stories")
public class Story {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    private String slug;
    private String summary;
    private String category;
    @Column(name = "cover_image") private String coverImage;
    @Column(name = "reading_time") private Integer readingTime;
    @Column(name = "created_at") private java.time.LocalDateTime createdAt;
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getSummary() { return summary; }
    public String getCategory() { return category; }
    public String getCoverImage() { return coverImage; }
    public Integer getReadingTime() { return readingTime; }
}
