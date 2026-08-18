package com.momentum.hub.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PresenceRequest(@NotBlank @Size(max = 40) String name) {
}
