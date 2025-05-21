package com.barcoder.scrud.apispec.infrastructure.jpa;

import com.barcoder.scrud.apispec.domain.entity.ApiSpecVersion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiSpecVersionJpaRepository extends JpaRepository<ApiSpecVersion, Long> {

}
