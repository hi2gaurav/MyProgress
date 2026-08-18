package com.momentum.hub.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record ChatMessage(
        @NotBlank @Size(max = 40) String author,
        @NotBlank @Size(max = 500) String message,
        String avatar,
        Instant sentAt
) {
    public ChatMessage stamp() {
        return new ChatMessage(author.trim(), message.trim(), avatar, Instant.now());
    }
}
