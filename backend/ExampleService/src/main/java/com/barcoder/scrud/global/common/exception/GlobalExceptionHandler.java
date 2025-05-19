package com.barcoder.scrud.global.common.exception;

import com.barcoder.scrud.global.common.error.ErrorReasonDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BaseException.class)
	public ResponseEntity<ErrorReasonDTO> handleException(BaseException exception) {
		ErrorReasonDTO errorReason = exception.getErrorReasonHttpStatus();

		return ResponseEntity.status(errorReason.getHttpStatus())
				.body(errorReason);
	}
}
