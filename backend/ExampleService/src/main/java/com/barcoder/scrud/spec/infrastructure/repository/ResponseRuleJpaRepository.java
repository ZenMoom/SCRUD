package com.barcoder.scrud.spec.infrastructure.repository;

import com.barcoder.scrud.spec.domain.entity.ResponseRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResponseRuleJpaRepository extends JpaRepository<ResponseRule, Long> {
	List<ResponseRule> findAllByOperationFieldRule_operationFieldRuleId(Long operationFieldRuleId);
}
