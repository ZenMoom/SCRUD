package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.model.FileTypeEnumDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Table(name = "global_files")
@Entity
@Getter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class GlobalFile extends BaseTimeEntity {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long globalFileId;

    @Setter
    @JoinColumn(name = "scrud_project_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private ScrudProject scrudProject;

    private String fileName;

    @Enumerated(EnumType.STRING)
    private FileTypeEnumDto fileType;

    private String fileUrl;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String fileContent;
}
