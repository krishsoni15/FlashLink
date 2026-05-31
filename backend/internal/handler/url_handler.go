package handler

import (
	"net/http"

	"github.com/flashlink/backend/internal/model"
	"github.com/flashlink/backend/internal/service"
	"github.com/gin-gonic/gin"
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

	userID, _ := c.Get("userID")

	result, err := h.urlService.CreateShortURL(c.Request.Context(), &req, userID.(string))
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

func (h *URLHandler) GetUserURLs(c *gin.Context) {
	userID, _ := c.Get("userID")
	urls, err := h.urlService.GetUserURLs(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch urls"})
		return
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	baseURL := scheme + "://" + c.Request.Host

	type CustomURLResponse struct {
		model.Link
		ShortURL string `json:"short_url"`
	}

	response := make([]CustomURLResponse, len(urls))
	for i, url := range urls {
		response[i] = CustomURLResponse{
			Link:     url,
			ShortURL: baseURL + "/" + url.ShortCode,
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": response,
		"total": len(urls),
		"page": 1,
		"per_page": 50,
		"total_pages": 1,
	})
}

func (h *URLHandler) DeleteURL(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *URLHandler) GetUserStats(c *gin.Context) {
	userID, _ := c.Get("userID")
	stats, err := h.urlService.GetDashboardAnalytics(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *URLHandler) GetDashboardAnalytics(c *gin.Context) {
	userID, _ := c.Get("userID")
	stats, err := h.urlService.GetDashboardAnalytics(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
