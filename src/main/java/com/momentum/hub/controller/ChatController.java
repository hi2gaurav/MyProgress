package com.momentum.hub.controller;

import com.momentum.hub.model.ChatMessage;
import com.momentum.hub.model.PresenceRequest;
import com.momentum.hub.model.PresenceUpdate;
import com.momentum.hub.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {
    private final CommunityService communityService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(CommunityService communityService, SimpMessagingTemplate messagingTemplate) {
        this.communityService = communityService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat")
    public ChatMessage send(@Valid ChatMessage message) {
        return message.stamp();
    }

    @MessageMapping("/presence.join")
    public void join(@Valid PresenceRequest request, @Header("simpSessionId") String sessionId) {
        int onlineCount = communityService.markActive(sessionId, request.name());
        messagingTemplate.convertAndSend("/topic/presence", new PresenceUpdate(onlineCount));
    }

    @EventListener
    public void leave(SessionDisconnectEvent event) {
        int onlineCount = communityService.markInactive(event.getSessionId());
        messagingTemplate.convertAndSend("/topic/presence", new PresenceUpdate(onlineCount));
    }
}
