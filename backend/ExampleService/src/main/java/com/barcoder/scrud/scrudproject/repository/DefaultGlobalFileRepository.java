package com.barcoder.scrud.scrudproject.repository;

import com.barcoder.scrud.model.FileTypeEnumDto;
import com.barcoder.scrud.scrudproject.domain.entity.DefaultGlobalFile;
import com.barcoder.scrud.scrudproject.domain.entity.GlobalFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefaultGlobalFileRepository extends JpaRepository<DefaultGlobalFile, Long> {
    DefaultGlobalFile findByFileType(FileTypeEnumDto fileType);
}
