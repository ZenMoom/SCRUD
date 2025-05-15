package com.barcoder.scrud.apispec.infrastructure.jpa;

import com.barcoder.scrud.apispec.domain.entity.ApiPrompt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiPromptJpaRepository extends JpaRepository<ApiPrompt, Long> {
}
