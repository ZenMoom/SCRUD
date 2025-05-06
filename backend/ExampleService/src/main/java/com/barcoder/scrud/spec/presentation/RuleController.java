package com.barcoder.scrud.spec.presentation;

import com.barcoder.scrud.api.RuleApi;
import com.barcoder.scrud.model.RuleResponse;
import com.barcoder.scrud.spec.application.dto.out.RuleOut;
import com.barcoder.scrud.spec.application.service.SpecService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RuleController implements RuleApi {

	private final SpecService specService;
	private final ModelMapper modelMapper;

	@Override
	public ResponseEntity<RuleResponse> getRules() {

		RuleOut outDto = specService.getRules();

		RuleResponse response = modelMapper.map(outDto, RuleResponse.class);

		return ResponseEntity.ok(response);
	}
}
