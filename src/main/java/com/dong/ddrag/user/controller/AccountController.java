package com.dong.ddrag.user.controller;

import com.dong.ddrag.common.api.ApiResponse;
import com.dong.ddrag.identity.service.CurrentUserService;
import com.dong.ddrag.user.model.dto.ChangePasswordRequest;
import com.dong.ddrag.user.model.dto.UpdateProfileRequest;
import com.dong.ddrag.user.model.vo.UserLookupResponse;
import com.dong.ddrag.user.service.AccountService;
import com.dong.ddrag.user.service.UserQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;
    private final CurrentUserService currentUserService;
    private final UserQueryService userQueryService;

    public AccountController(
            AccountService accountService,
            CurrentUserService currentUserService,
            UserQueryService userQueryService
    ) {
        this.accountService = accountService;
        this.currentUserService = currentUserService;
        this.userQueryService = userQueryService;
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpServletRequest
    ) {
        accountService.changePassword(currentUserService.getRequiredCurrentUser(httpServletRequest), request);
        return ApiResponse.success(null);
    }

    @PatchMapping("/profile")
    public ApiResponse<Void> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpServletRequest
    ) {
        accountService.updateProfile(currentUserService.getRequiredCurrentUser(httpServletRequest), request);
        return ApiResponse.success(null);
    }

    @GetMapping("/lookup-user")
    public ApiResponse<UserLookupResponse> lookupUser(
            @RequestParam String userCode,
            HttpServletRequest request
    ) {
        currentUserService.requireBusinessUser(request);
        return ApiResponse.success(userQueryService.lookupByUserCode(userCode));
    }
}
