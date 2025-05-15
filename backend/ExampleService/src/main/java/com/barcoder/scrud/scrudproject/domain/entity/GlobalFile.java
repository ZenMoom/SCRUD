package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import com.barcoder.scrud.model.FileTypeEnumDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Table(name = "global_files")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class GlobalFile extends BaseTimeEntity {


    @Id
    @SnowflakeId
    private Long globalFileId;

    @Setter
    @JoinColumn(name = "scrud_project_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private ScrudProject scrudProject;

    private String fileName;

    @Enumerated(EnumType.STRING)
    private FileTypeEnumDto fileType;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String fileContent;
}
