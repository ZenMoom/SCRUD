package com.barcoder.scrud.global.common.error;

import com.barcoder.scrud.global.common.error.BaseErrorCode;
import com.barcoder.scrud.global.common.error.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorStatus implements BaseErrorCode {
    // Common Errors
    _INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "서버 내부 오류가 발생했습니다."),
    _BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON400", "잘못된 요청입니다."),
    _UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON401", "인증이 필요합니다."),
    _FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON403", "접근 권한이 없습니다."),
    _METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON405", "지원하지 않는 HTTP 메서드입니다."),

    // 토큰 관련 에러
    TOKEN_EXPIRED_ERROR(HttpStatus.UNAUTHORIZED, "TOKEN4001", "토큰의 유효기간이 만료되었습니다."),
    TOKEN_MALFORMED_ERROR(HttpStatus.UNAUTHORIZED, "TOKEN4002", "토큰이 변형되었습니다."),
    TOKEN_UNSUPPORTED_ERROR(HttpStatus.BAD_REQUEST, "TOKEN4003", "지원되지 않는 형식의 토큰입니다."),
    TOKEN_SIGNATURE_ERROR(HttpStatus.UNAUTHORIZED, "TOKEN4004", "토큰의 서명이 유효하지 않습니다."),
    TOKEN_ILLEGAL_ARGUMENT_ERROR(HttpStatus.BAD_REQUEST, "TOKEN4005", "토큰 값이 잘못되었습니다."),
    TOKEN_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "TOKEN5000", "토큰 처리 중 알 수 없는 에러가 발생했습니다."),
    TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "TOKEN4006", "유저의 토큰정보를 얻어올 수 없습니다. 헤더를 확인하세요"),

    // 회원 관련 오류
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER4001", "존재하지 않는 계정입니다."),
    USER_NOT_ADMIN(HttpStatus.FORBIDDEN, "USER4002", "관리자 권한이 없습니다."),

    // 프로젝트 관련 오류
    SCRUDPROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "PROJECT4001", "존재하지 않는 프로젝트입니다."),
    
    // 전역파일 관련 오류
    GLOBALFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "GLOBALFILE4001", "존자하지 않는 전역파일입니다.");


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
