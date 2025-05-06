package com.barcoder.scrud.apispec.application.facade;

import com.barcoder.scrud.apispec.application.service.ApiSpecVersionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiCreateFacade {

	private final ApiSpecVersionService apiSpecVersionService;
}
