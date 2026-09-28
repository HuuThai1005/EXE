package com.mekongstorybox.repository;

import com.mekongstorybox.entity.CustomerOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderStatusHistoryRepository extends JpaRepository<CustomerOrderStatusHistory, Long> {
    List<CustomerOrderStatusHistory> findAllByOrder_IdInOrderByCreatedAtAsc(List<Long> orderIds);
}