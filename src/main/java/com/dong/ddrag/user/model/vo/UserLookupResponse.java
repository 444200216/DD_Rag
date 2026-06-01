package com.dong.ddrag.user.model.vo;

public record UserLookupResponse(
        Long userId,
        String userCode,
        String displayName
) {
}