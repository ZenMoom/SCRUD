package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

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
    @SnowflakeId
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

    public void update(ScrudProject updateProject) {
        this.title = updateProject.getTitle();
        this.description = updateProject.getDescription();
        this.serverUrl = updateProject.getServerUrl();
    }
}
