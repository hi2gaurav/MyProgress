package com.momentum.hub.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CommunityServiceTest {
    private final CommunityService service = new CommunityService();

    @Test
    void suppliesTheDailyPlanAndTracksActiveCommunityMembers() {
        assertThat(service.dashboard().tasks()).hasSize(3);
        assertThat(service.dashboard().resources()).hasSize(3);
        assertThat(service.markActive("one", "Maya")).isEqualTo(1);
        assertThat(service.markActive("two", "Jai")).isEqualTo(2);
        assertThat(service.markInactive("one")).isEqualTo(1);
    }
}
