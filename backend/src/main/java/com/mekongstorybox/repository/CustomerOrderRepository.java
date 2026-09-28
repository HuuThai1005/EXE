package com.mekongstorybox.repository;

import com.mekongstorybox.entity.CustomerOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select customerOrder from CustomerOrder customerOrder where customerOrder.id = :id")
	java.util.Optional<CustomerOrder> findByIdForUpdate(@Param("id") Long id);

	@EntityGraph(attributePaths = "items")
	List<CustomerOrder> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

	@EntityGraph(attributePaths = {"items", "user"})
	List<CustomerOrder> findAllByOrderByCreatedAtDesc();
}