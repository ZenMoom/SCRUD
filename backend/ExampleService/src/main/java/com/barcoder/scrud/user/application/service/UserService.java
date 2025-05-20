package com.barcoder.scrud.user.application.service;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.ExceptionHandler;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.usecase.UserUseCase;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.user.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UserUseCase {

	private final UserRepository userRepository;
	private final ModelMapper modelMapper;

	@Override
	public UserOut getUserById(UUID userId) {

		// user 조회
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ExceptionHandler(ErrorStatus.USER_NOT_FOUND));

		return modelMapper.map(user, UserOut.class);
	}
}
