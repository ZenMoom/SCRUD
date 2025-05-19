package com.barcoder.scrud.post.application.facade;

import com.barcoder.scrud.global.common.error.ErrorStatus;
import com.barcoder.scrud.global.common.exception.BaseException;
import com.barcoder.scrud.post.application.dto.in.UpdatePostStatusIn;
import com.barcoder.scrud.post.application.service.PostService;
import com.barcoder.scrud.user.application.dto.out.UserOut;
import com.barcoder.scrud.user.application.service.UserService;
import com.barcoder.scrud.user.domain.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Transactional
@Service
@RequiredArgsConstructor
public class PostAdminFacade {

    private final UserService userService;
    private final PostService postService;
    
    public void updatePostStatus(UpdatePostStatusIn inDto) {
        
        // user 조회
        UserOut userOut = userService.getUserById(inDto.getUserId());

        // role 확인
        if (!userOut.getRole().equals(UserRole.ADMIN)) {
            throw new BaseException(ErrorStatus.USER_NOT_ADMIN);
        }
        
        // post status 변경
        postService.updatePostStatus(inDto);
        
    }
}
