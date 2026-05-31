package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/flashlink/backend/internal/service"
	"github.com/flashlink/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func extractToken(c *gin.Context) string {
	bearerToken := c.GetHeader("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}

func AuthMiddleware(authService *service.AuthService, apiKeyService *service.APIKeyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			token = c.GetHeader("X-API-Key")
		}
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token or API key required"})
			c.Abort()
			return
		}

		if strings.HasPrefix(token, "fl_live_") {
			workspaceID, err := apiKeyService.ValidateKey(c.Request.Context(), token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired API key"})
				c.Abort()
				return
			}
			c.Set("userID", workspaceID)
			c.Set("authMethod", "api_key")
		} else {
			userID, err := authService.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
				c.Abort()
				return
			}
			c.Set("userID", userID)
			c.Set("authMethod", "jwt")
		}

		c.Next()
	}
}

func GetUserID(c *gin.Context) (string, bool) {
	id, exists := c.Get("userID")
	if !exists {
		return "", false
	}
	return id.(string), true
}

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logger.Info("HTTP Request",
			"method", c.Request.Method,
			"path", path,
			"status", status,
			"latency", latency.String(),
			"ip", c.ClientIP(),
			"user_agent", c.Request.UserAgent(),
		)
	}
}
