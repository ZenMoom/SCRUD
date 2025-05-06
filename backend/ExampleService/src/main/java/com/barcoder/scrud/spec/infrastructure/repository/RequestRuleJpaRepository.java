package com.barcoder.scrud.spec.infrastructure.repository;

import com.barcoder.scrud.spec.domain.entity.RequestRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface RequestRuleJpaRepository extends JpaRepository<RequestRule, Long> {
	List<RequestRule> findAllByOperationFieldRule_operationFieldRuleId(Long operationFieldRuleId);
}
