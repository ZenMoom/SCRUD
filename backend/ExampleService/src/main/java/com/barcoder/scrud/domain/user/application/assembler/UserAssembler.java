package com.barcoder.scrud.domain.user.application.assembler;

import com.barcoder.scrud.domain.oauth.provider.GoogleOAuth2UserInfo;
import com.barcoder.scrud.domain.user.model.entity.User;
import com.barcoder.scrud.util.GenerateRandomNickname;
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
