package com.dong.ddrag.auth.model.vo;

import com.dong.ddrag.common.enums.SystemRole;
import com.dong.ddrag.common.enums.UserStatus;
import com.dong.ddrag.identity.service.CurrentUserService;

import java.time.LocalDateTime;

public record CurrentUserProfileResponse(
        Long userId,
        String userCode,
        String username,
        String displayName,
        String email,
        SystemRole systemRole,
        UserStatus status,
        boolean mustChangePassword,
        LocalDateTime lastLoginAt
) {

    public static CurrentUserProfileResponse from(CurrentUserService.CurrentUser currentUser) {
        return new CurrentUserProfileResponse(
                currentUser.userId(),
                currentUser.userCode(),
                currentUser.username(),
                currentUser.displayName(),
                currentUser.email(),
                currentUser.systemRole(),
                currentUser.status(),
                currentUser.mustChangePassword(),
                currentUser.lastLoginAt()
        );
    }
}
