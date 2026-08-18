package com.momentum.hub.model;

import java.util.List;

public record DashboardResponse(
        String dateLabel,
        String greeting,
        String focusLine,
        int memberCount,
        int onlineCount,
        int completedCount,
        List<CommunityTask> tasks,
        List<ResourceLink> resources
) {
}
