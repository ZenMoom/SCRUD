package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Table(name = "scrud_project")
@Entity
@Getter
@Builder
@ToString
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class ScrudProject extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scrudProjectId;

    private UUID userId;

    private String title;

    private String description;

    private String serverUrl;

    @Setter
    @OneToMany(mappedBy = "scrudProject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GlobalFile> globalFileList = new ArrayList<>();

    public void addGlobalFile(GlobalFile file) {
        globalFileList.add(file);
        file.setScrudProject(this);
    }
}
