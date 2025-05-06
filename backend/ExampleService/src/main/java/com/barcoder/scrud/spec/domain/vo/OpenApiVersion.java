package com.barcoder.scrud.spec.domain.vo;

import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Embeddable
@Getter
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class OpenApiVersion {

	@Column(nullable = false)
	private int major;

	@Column(nullable = false)
	private int minor;

	@Column(nullable = false)
	private int patch;

	@JsonValue
	public String getVersion() {
		return major + "." + minor + "." + patch;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || getClass() != o.getClass()) return false;
		OpenApiVersion that = (OpenApiVersion) o;
		return major == that.major && minor == that.minor && patch == that.patch;
	}

	@Override
	public int hashCode() {
		return Objects.hash(major, minor, patch);
	}
}
