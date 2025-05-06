package com.barcoder.scrud.global.common.error;

public interface BaseErrorCode {
    ErrorReasonDTO getReason();
    ErrorReasonDTO getReasonHttpStatus();
}