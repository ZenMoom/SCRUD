package com.barcoder.scrud.apispec.presentation;

import com.barcoder.scrud.api.ApiSpecApi;
import com.barcoder.scrud.apispec.application.facade.ApiCreateFacade;
import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import com.barcoder.scrud.model.ApiSpecRequest;
import com.barcoder.scrud.model.ApiSpecWithFields;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ApiSpecController implements ApiSpecApi {

	private final ApiSpecVersionService apiSpecVersionService;
	private final ApiCreateFacade apiCreateFacade;
	private final ModelMapper modelMapper;

	@Override
	public ResponseEntity<Integer> createApiSpec(ApiSpecRequest apiSpecRequest) {
		return null;
	}

	@Override
	public ResponseEntity<ApiSpecWithFields> getApiSpecById(Integer apiSpecVersionId) {
		return null;
	}

	@Override
	public ResponseEntity<Boolean> updateApiSpec(Integer apiSpecVersionId, ApiSpecRequest apiSpecRequest) {
		return null;
	}
}
