package com.barcoder.scrud.user.application.dto.out;

import com.barcoder.scrud.user.domain.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UserOut {

    private UUID userId;
    private String username;
    private String nickname;
    private String profileImgUrl;
    private UserRole role;
    private boolean isGithubConnected;
}
