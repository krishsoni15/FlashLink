package handler

import (
	"net/http"

	"github.com/flashlink/backend/internal/model"
	"github.com/flashlink/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type URLHandler struct {
	urlService *service.URLService
}

func NewURLHandler(urlService *service.URLService) *URLHandler {
	return &URLHandler{urlService: urlService}
}

func (h *URLHandler) CreateShortURL(c *gin.Context) {
	var req model.CreateURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	result, err := h.urlService.CreateShortURL(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

func (h *URLHandler) RedirectURL(c *gin.Context) {
	shortCode := c.Param("shortCode")
	if shortCode == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	originalURL, linkID, err := h.urlService.Resolve(c.Request.Context(), shortCode, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	h.urlService.RecordClick(linkID, shortCode, c.ClientIP(), c.Request.UserAgent(), c.Request.Referer())

	// 301 Permanent Redirect
	c.Redirect(http.StatusMovedPermanently, originalURL)
}

func (h *URLHandler) GetAnalytics(c *gin.Context) {
	shortCode := c.Param("shortCode")
	
	analytics, err := h.urlService.GetAnalytics(c.Request.Context(), shortCode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}
