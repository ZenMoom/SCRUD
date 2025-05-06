package com.barcoder.scrud.spec.application.dto.out;

import com.barcoder.scrud.spec.domain.vo.OpenApiVersion;
import com.barcoder.scrud.spec.domain.vo.ScrudVersion;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class RuleOut {

	private Long serviceSpecVersionId;

	private SpecVersionOut specVersion;

	private ScrudVersion scrudVersion;

	private String status;
	private String description;

	private List<OperationFieldRuleOut> operationFieldRules;

	@Getter
	@Builder(toBuilder = true)
	@AllArgsConstructor
	@NoArgsConstructor
	private static class SpecVersionOut {

		private Long SpecVersionId;
		private OpenApiVersion openApiVersion;
		private String description;
	}

	@Getter
	@Builder(toBuilder = true)
	@AllArgsConstructor
	@NoArgsConstructor
	public static class OperationFieldRuleOut {

		private Long operationFieldRuleId;
		private String fieldName;
		private Boolean isEditable;

		private String editableSubFields;

		private List<ParameterRuleOut> parameterRules;
		private List<RequestRuleOut> requestRules;
		private List<ResponseRuleOut> responseRules;

	}
}
