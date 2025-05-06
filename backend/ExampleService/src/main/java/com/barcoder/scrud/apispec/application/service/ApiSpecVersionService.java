package com.barcoder.scrud.apispec.application.service;

import com.barcoder.scrud.apispec.infrastructure.jpa.ApiSpecVersionJpaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ApiSpecVersionService {

	private final ApiSpecVersionJpaRepository apiSpecVersionJpaRepository;
}
