package com.barcoder.scrud.spec.infrastructure.repository;

import com.barcoder.scrud.spec.domain.entity.ServiceSpecVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceSpecVersionJpaRepository extends JpaRepository<ServiceSpecVersion, Long> {
}
