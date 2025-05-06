package com.barcoder.scrud.apispec.domain.exception;

import com.barcoder.scrud.global.common.error.BaseErrorCode;
import com.barcoder.scrud.global.common.error.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ApiSpecVersionErrorStatus implements BaseErrorCode {

	API_SPEC_VERSION_NOT_FOUND(HttpStatus.NOT_FOUND, "API5001", "존재하지 않는 API 스펙입니다.");

	private final HttpStatus httpStatus;
	private final String code;
	private final String message;

	@Override
	public ErrorReasonDTO getReason() {
		return ErrorReasonDTO.builder()
				.message(message)
				.code(code)
				.isSuccess(false)
				.build();
	}

	@Override
	public ErrorReasonDTO getReasonHttpStatus() {
		return ErrorReasonDTO.builder()
				.message(message)
				.code(code)
				.isSuccess(false)
				.httpStatus(httpStatus)
				.build();
	}
}
