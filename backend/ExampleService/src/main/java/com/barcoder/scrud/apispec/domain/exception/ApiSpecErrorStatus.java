package com.barcoder.scrud.apispec.domain.exception;

import com.barcoder.scrud.global.common.error.BaseErrorCode;
import com.barcoder.scrud.global.common.error.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ApiSpecErrorStatus implements BaseErrorCode {

	API_SPEC_VERSION_NOT_FOUND(HttpStatus.NOT_FOUND, "API5001", "존재하지 않는 API 스펙입니다."),
	API_SPEC_NOT_FOUND(HttpStatus.NOT_FOUND, "API5002", "API 스펙을 찾을 수 없습니다."),
	API_SPEC_VERSION_NOT_BELONG_TO_USER(HttpStatus.FORBIDDEN, "API5003", "해당 API 스펙 버전은 요청자에게 속하지 않습니다."),
	;

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
