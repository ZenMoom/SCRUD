package com.barcoder.scrud.post.domain.entity;

import com.barcoder.scrud.global.config.generator.SnowflakeId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "category")
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Category {

	@Id
	@SnowflakeId
	private Long categoryId;

	@Column(nullable = false, columnDefinition = "varchar(255)")
	private String name;
}
