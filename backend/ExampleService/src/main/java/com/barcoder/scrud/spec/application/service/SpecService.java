package com.barcoder.scrud.spec.application.service;

import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.spec.application.dto.out.ParameterRuleOut;
import com.barcoder.scrud.spec.application.dto.out.RequestRuleOut;
import com.barcoder.scrud.spec.application.dto.out.ResponseRuleOut;
import com.barcoder.scrud.spec.application.dto.out.RuleOut;
import com.barcoder.scrud.spec.domain.entity.ParameterRule;
import com.barcoder.scrud.spec.domain.entity.RequestRule;
import com.barcoder.scrud.spec.domain.entity.ResponseRule;
import com.barcoder.scrud.spec.domain.entity.ServiceSpecVersion;
import com.barcoder.scrud.spec.domain.exception.SpecErrorStatus;
import com.barcoder.scrud.spec.infrastructure.querydsl.SpecQuerydsl;
import com.barcoder.scrud.spec.infrastructure.repository.ParameterRuleJpaRepository;
import com.barcoder.scrud.spec.infrastructure.repository.RequestRuleJpaRepository;
import com.barcoder.scrud.spec.infrastructure.repository.ResponseRuleJpaRepository;
import com.barcoder.scrud.spec.infrastructure.repository.ServiceSpecVersionJpaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SpecService {

	private final ServiceSpecVersionJpaRepository serviceSpecVersionJpaRepository;
	private final ResponseRuleJpaRepository responseRuleJpaRepository;
	private final ParameterRuleJpaRepository parameterRuleJpaRepository;
	private final RequestRuleJpaRepository requestRuleJpaRepository;
	private final SpecQuerydsl specQuerydsl;

	private final ModelMapper modelMapper;

	public RuleOut getRules() {

		// 1. 최신 서비스 스펙 버전 조회
		ServiceSpecVersion latestServiceSpecVersionWithRules = specQuerydsl.getLatestServiceSpecVersionWithRules();

		// 2. 최신 서비스 스펙 버전이 존재하지 않는 경우
		if (latestServiceSpecVersionWithRules == null) {
			throw new BaseException(SpecErrorStatus.VERSION_NOT_FOUND);
		}

		// 3. 최신 서비스 스펙 버전의 규칙을 DTO로 변환
		RuleOut outDto = modelMapper.map(latestServiceSpecVersionWithRules, RuleOut.class);

		// 4. 세부 규칙에 따른 룰 추가
		List<RuleOut.OperationFieldRuleOut> operationFieldRules = outDto.getOperationFieldRules();
		List<RuleOut.OperationFieldRuleOut> modifiedRules = getOperationFieldRuleOuts(operationFieldRules);

		return outDto.toBuilder()
				.operationFieldRules(modifiedRules)
				.build();
	}

	/**
	 * 세부 규칙에 따른 룰 추가
	 */
	private List<RuleOut.OperationFieldRuleOut> getOperationFieldRuleOuts(List<RuleOut.OperationFieldRuleOut> operationFieldRules) {
		return operationFieldRules.stream()
				.map(rule -> {
					final Long operationFieldRuleId = rule.getOperationFieldRuleId();

					switch (rule.getFieldName()) {
						// 1. parameterRules
						case "parameters" -> {
							List<ParameterRule> parameterRules = parameterRuleJpaRepository
									.findAllByOperationFieldRule_operationFieldRuleId(operationFieldRuleId);
							List<ParameterRuleOut> parameterRuleOuts =
									parameterRules.stream()
											.map(param -> modelMapper.map(param, ParameterRuleOut.class))
											.toList();
							return rule.toBuilder().parameterRules(parameterRuleOuts).build();
						}

						// 2. requestRules
						case "requestBody" -> {
							List<RequestRule> requestRules = requestRuleJpaRepository
									.findAllByOperationFieldRule_operationFieldRuleId(operationFieldRuleId);
							List<RequestRuleOut> outs = requestRules.stream()
									.map(req -> modelMapper.map(req, RequestRuleOut.class))
									.toList();
							return rule.toBuilder().requestRules(outs).build();
						}

						// 3. responseRules
						case "responses" -> {
							List<ResponseRule> responseRules = responseRuleJpaRepository
									.findAllByOperationFieldRule_operationFieldRuleId(operationFieldRuleId);
							List<ResponseRuleOut> outs = responseRules.stream()
									.map(resp -> modelMapper.map(resp, ResponseRuleOut.class))
									.toList();
							return rule.toBuilder().responseRules(outs).build();
						}

						default -> {
							return rule;
						}
					}
				})
				.toList();
	}

}
