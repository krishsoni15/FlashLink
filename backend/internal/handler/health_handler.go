package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/flashlink/backend/internal/cache"
	"github.com/flashlink/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

// HealthHandler handles health check requests
type HealthHandler struct {
	db    *repository.Database
	cache *cache.RedisCache
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *repository.Database, cache *cache.RedisCache) *HealthHandler {
	return &HealthHandler{db: db, cache: cache}
}

// HealthCheck handles GET /health
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "healthy"
	if err := h.db.Ping(); err != nil {
		dbStatus = "unhealthy: " + err.Error()
	}

	redisStatus := "healthy"
	if err := h.cache.Ping(ctx); err != nil {
		redisStatus = "unhealthy: " + err.Error()
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
