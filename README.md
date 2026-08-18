# Momentum Hub

A mobile-first Spring Boot community workspace built for a daily WhatsApp group ritual.

## What is included

- Daily task cards and key resources served from a REST API
- Live WebSocket chat and connected-member count using STOMP
- Personal display names and persistent task check-off in the browser
- Responsive, accessible desktop and mobile layout
- Sensible API/service boundaries for adding a database, moderation, authentication, or a WhatsApp integration later

## Run locally

Requires Java 21 and Maven.

```powershell
mvn spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080).

## Customizing the community

Edit `CommunityService.java` to change the daily task content, useful links, community size, and the message displayed on the home page. The browser reads this content dynamically from `GET /api/dashboard`.

For a production deployment, replace the in-memory WebSocket broker with a broker such as RabbitMQ and persist chat/messages/tasks in a database.
