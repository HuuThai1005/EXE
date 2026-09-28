package com.mekongstorybox.repository;

import com.mekongstorybox.entity.CustomerOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
	@EntityGraph(attributePaths = "items")
	List<CustomerOrder> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

	@EntityGraph(attributePaths = {"items", "user"})
	List<CustomerOrder> findAllByOrderByCreatedAtDesc();
}