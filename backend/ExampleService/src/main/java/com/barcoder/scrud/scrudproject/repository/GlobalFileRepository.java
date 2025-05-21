package com.barcoder.scrud.scrudproject.repository;

import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GlobalFileRepository extends JpaRepository<GlobalFile, Long> {
}
