package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/flashlink/backend/internal/cache"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var startTime = time.Now()

// HealthHandler handles health check requests
type HealthHandler struct {
	db    *gorm.DB
	cache *cache.RedisCache
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB, cache *cache.RedisCache) *HealthHandler {
	return &HealthHandler{db: db, cache: cache}
}

// HealthCheck handles GET /health
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "healthy"
	if err := h.db.WithContext(ctx).Exec("SELECT 1").Error; err != nil {
		dbStatus = "unhealthy: " + err.Error()
	}

	redisStatus := "healthy"
	if h.cache == nil {
		redisStatus = "unhealthy: cache not initialized"
	}

	status := "healthy"
	statusCode := http.StatusOK
	if dbStatus != "healthy" || redisStatus != "healthy" {
		status = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	uptime := time.Since(startTime).Round(time.Second)

	c.JSON(statusCode, gin.H{
		"status":   status,
		"database": dbStatus,
		"redis":    redisStatus,
		"version":  "1.0.0",
		"uptime":   uptime.String(),
	})
}
