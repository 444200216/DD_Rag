package com.dong.ddrag.user.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "显示名称不能为空") @Size(max = 128, message = "显示名称最长128个字符") String displayName,
        @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") @Size(max = 128, message = "邮箱最长128个字符") String email
) {
}