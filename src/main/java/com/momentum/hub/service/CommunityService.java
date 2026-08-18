package com.momentum.hub.service;

import com.momentum.hub.model.CommunityTask;
import com.momentum.hub.model.DashboardResponse;
import com.momentum.hub.model.ResourceLink;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CommunityService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("EEEE, d MMMM");
    private final ConcurrentHashMap<String, String> activeSessions = new ConcurrentHashMap<>();

    public DashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        return new DashboardResponse(
                today.format(DATE_FORMAT),
                greetingFor(),
                "Small, focused actions compound into remarkable progress.",
                200,
                activeSessions.size(),
                126,
                tasksFor(today.getDayOfWeek()),
                List.of(
                        new ResourceLink("Task workbook", "Today’s guided worksheet", "#", "↗", "lavender"),
                        new ResourceLink("Focus playlist", "Deep work · 52 min", "#", "♫", "peach"),
                        new ResourceLink("Community notes", "Wins & useful takeaways", "#", "✦", "mint")
                )
        );
    }

    public int markActive(String sessionId, String name) {
        activeSessions.put(sessionId, name.trim());
        return activeSessions.size();
    }

    public int markInactive(String sessionId) {
        activeSessions.remove(sessionId);
        return activeSessions.size();
    }

    private String greetingFor() {
        int hour = java.time.LocalTime.now().getHour();
        if (hour < 12) return "Good morning, builders.";
        if (hour < 17) return "Good afternoon, builders.";
        return "Good evening, builders.";
    }

    private List<CommunityTask> tasksFor(DayOfWeek day) {
        String theme = switch (day) {
            case MONDAY -> "Set the week’s direction";
            case TUESDAY -> "Build momentum";
            case WEDNESDAY -> "Share what’s working";
            case THURSDAY -> "Refine your systems";
            case FRIDAY -> "Finish strong";
            case SATURDAY -> "Make space to learn";
            case SUNDAY -> "Reflect and reset";
        };
        return List.of(
                new CommunityTask("focus", "TODAY'S FOCUS", theme, "Choose one meaningful outcome, break it into the next tiny action, and begin before you feel ready.", "25 min", "coral"),
                new CommunityTask("share", "COMMUNITY PROMPT", "Post your proof of work", "Share a photo, note, or one-line win in the chat. Your consistency may be exactly what someone else needs today.", "5 min", "violet"),
                new CommunityTask("reflect", "EVENING RESET", "Close the loop", "Before signing off, write one thing you completed and one thing you’ll make easier tomorrow.", "3 min", "sun")
        );
    }
}
