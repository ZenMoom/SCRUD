package com.barcoder.scrud.apispec.presentation;

import com.barcoder.scrud.api.ApiSpecApi;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.application.facade.ApiCreateFacade;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.model.ApiSpecVersionRequest;
import com.barcoder.scrud.model.ApiSpecWithFields;
import com.barcoder.scrud.model.CreateApiSpec201Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ApiSpecController implements ApiSpecApi {

	private final ApiSpecVersionService apiSpecVersionService;
	private final ApiCreateFacade apiCreateFacade;
	private final ModelMapper modelMapper;

	@Override
	public ResponseEntity<CreateApiSpec201Response> createApiSpec(ApiSpecVersionRequest apiSpecRequest) {

		CreateApiSpecVersionIn inDto = modelMapper.map(apiSpecRequest, CreateApiSpecVersionIn.class);
		ApiSpecVersionOut outDto = apiCreateFacade.createApiSpecVersion(inDto);
		CreateApiSpec201Response response = modelMapper.map(outDto, CreateApiSpec201Response.class);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(response);
	}

	@Override
	public ResponseEntity<ApiSpecWithFields> getApiSpecById(Integer apiSpecVersionId) {
		return null;
	}

	@Override
	public ResponseEntity<Boolean> updateApiSpec(Integer apiSpecVersionId, ApiSpecVersionRequest apiSpecRequest) {
		return null;
	}
}
