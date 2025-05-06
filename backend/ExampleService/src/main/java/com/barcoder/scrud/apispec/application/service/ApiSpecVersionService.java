package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.application.assembler.ApiSpecVersionAssembler;
import com.barcoder.scrud.apispec.application.dto.in.CreateApiSpecVersionIn;
import com.barcoder.scrud.apispec.application.dto.out.ApiSpecVersionOut;
import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiSpecVersionService {

	private final ApiSpecVersionAssembler apiSpecVersionAssembler;
	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;

	private final ModelMapper modelMapper;

	public ApiSpecVersionOut createApiSpecVersion(CreateApiSpecVersionIn inDto) {

		ApiSpecVersion apiSpecVersion = apiSpecVersionAssembler.toApiSpecVersionEntity(inDto);

		apiSpecVersionJpaRepository.save(apiSpecVersion);

		return modelMapper.map(apiSpecVersion, ApiSpecVersionOut.class);
	}
}
