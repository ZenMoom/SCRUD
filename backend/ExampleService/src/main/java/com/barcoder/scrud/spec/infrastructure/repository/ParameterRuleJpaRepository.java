package com.barcoder.scrud.spec.infrastructure.repository;

import com.barcoder.scrud.spec.domain.entity.OperationFieldRule;
import com.barcoder.scrud.spec.domain.entity.ParameterRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParameterRuleJpaRepository extends JpaRepository<ParameterRule, Long> {
	List<ParameterRule> findAllByOperationFieldRule_operationFieldRuleId(Long operationFieldRuleId);
}
