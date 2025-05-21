package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import com.barcoder.scrud.model.FileTypeEnumDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.ToString;

@Table(name = "default_global_files")
@Entity
@Getter
@ToString
public class DefaultGlobalFile extends BaseTimeEntity {

    @Id
    @SnowflakeId
    private Long defaultGlobalFileId;

    private String fileName;

    @Enumerated(EnumType.STRING)
    private FileTypeEnumDto fileType;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String fileContent;
}