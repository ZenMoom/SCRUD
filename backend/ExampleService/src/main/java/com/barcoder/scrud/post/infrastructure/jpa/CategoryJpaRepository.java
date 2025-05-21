package com.barcoder.scrud.post.infrastructure.jpa;

import com.barcoder.scrud.post.domain.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryJpaRepository extends JpaRepository<Category, Long> {
}
