package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.model.FileTypeEnumDto;
import jakarta.persistence.*;
import lombok.*;

@Table(name = "default_global_files")
@Entity
@Getter
public class DefaultGlobalFile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long defaultGlobalFileId;

    private String fileName;

    @Enumerated(EnumType.STRING)
    private FileTypeEnumDto fileType;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String fileContent;
}