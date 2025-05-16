package com.barcoder.scrud.user.application.usecase;

import com.barcoder.scrud.user.application.dto.out.UserOut;

import java.util.UUID;

public interface UserUseCase {
    UserOut getUserById(UUID userId);
}
