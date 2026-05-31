package handler

import (
	"net/http"
	"time"

	"github.com/flashlink/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type APIKeyHandler struct {
	keyService *service.APIKeyService
}

func NewAPIKeyHandler(keyService *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{keyService: keyService}
}

type CreateKeyReq struct {
	Name      string     `json:"name" binding:"required"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// In V1, user ID acts as the default workspace ID since we haven't built out the full multi-tenant UI yet.
func (h *APIKeyHandler) Create(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req CreateKeyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	uid, _ := uuid.Parse(userID.(string))
	resp, err := h.keyService.Create(c.Request.Context(), uid, req.Name, req.ExpiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API key"})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *APIKeyHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	
	keys, err := h.keyService.List(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch API keys"})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *APIKeyHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	keyID := c.Param("id")

	if err := h.keyService.Delete(c.Request.Context(), keyID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key deleted"})
}
