package com.momentum.hub.controller;

import com.momentum.hub.model.DashboardResponse;
import com.momentum.hub.service.CommunityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CommunityApiController {
    private final CommunityService communityService;

    public CommunityApiController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return communityService.dashboard();
    }
}
