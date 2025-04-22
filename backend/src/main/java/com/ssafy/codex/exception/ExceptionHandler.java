package com.ssafy.codex.exception;

import com.ssafy.codex.base.code.BaseErrorCode;

public class ExceptionHandler extends BaseException {

    public ExceptionHandler(BaseErrorCode errorCode) {
        super(errorCode);
    }
}