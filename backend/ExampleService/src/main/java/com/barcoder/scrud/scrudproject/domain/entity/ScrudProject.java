package com.barcoder.scrud.scrudproject.domain.entity;

import com.barcoder.scrud.global.common.baseentity.BaseTimeEntity;
import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Filter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Table(name = "scrud_project")
@Entity
@Getter
@Builder
@ToString
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
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
    @Column(name="is_deleted")
    private Boolean isDeleted;

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
