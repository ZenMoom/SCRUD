package com.barcoder.scrud.user.application.assembler;

import com.barcoder.scrud.oauth.provider.GoogleOAuth2UserInfo;
import com.barcoder.scrud.user.domain.entity.User;
import com.barcoder.scrud.global.common.util.GenerateRandomNickname;
import org.springframework.stereotype.Component;

@Component
public class UserAssembler {

    public User assemble(GoogleOAuth2UserInfo userInDto) {
        return User.builder()
            .username(userInDto.getEmail())
            .profileImgUrl(userInDto.getImageUrl())
            .nickname(GenerateRandomNickname.generateRandomNickname())
            .build();
    }
}
