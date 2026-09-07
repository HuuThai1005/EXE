package com.mekongstorybox.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "digital_passports")
public class DigitalPassport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false, unique = true) private User user;
    @Column(name = "total_points", nullable = false) private int totalPoints;
    @Column(nullable = false) private int level;
    @Column(name = "exploration_count", nullable = false) private int explorationCount;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    protected DigitalPassport() {}
    public DigitalPassport(User user) { this.user = user; this.level = 1; this.createdAt = LocalDateTime.now(); this.updatedAt = this.createdAt; }
    public int getTotalPoints() { return totalPoints; }
    public int getLevel() { return level; }
    public int getExplorationCount() { return explorationCount; }
    public void addExploration(int points) { explorationCount++; totalPoints += points; level = Math.max(1, totalPoints / 500 + 1); updatedAt = LocalDateTime.now(); }
}
