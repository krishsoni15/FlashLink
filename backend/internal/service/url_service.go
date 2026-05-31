package service

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/flashlink/backend/internal/cache"
	"github.com/flashlink/backend/internal/config"
	"github.com/flashlink/backend/internal/model"
	"github.com/flashlink/backend/internal/repository"
	"github.com/flashlink/backend/pkg/logger"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

type URLService struct {
	repo   *repository.Repository
	cache  *cache.RedisCache
	config *config.Config
}

func NewURLService(repo *repository.Repository, cache *cache.RedisCache, cfg *config.Config) *URLService {
	return &URLService{
		repo:   repo,
		cache:  cache,
		config: cfg,
	}
}

func (s *URLService) CreateShortURL(ctx context.Context, req *model.CreateURLRequest, userIDStr string) (*model.URLResponse, error) {
	shortCode := req.CustomAlias
	if shortCode == "" {
		shortCode = generateShortCode(s.config.App.ShortCodeLength)
	}

	uid, _ := uuid.Parse(userIDStr)
	wsID, err := s.repo.FindOrCreateWorkspace(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("workspace resolution failed: %w", err)
	}

	url := &model.Link{
		ShortCode:   shortCode,
		OriginalURL: req.URL,
		UserID:      &uid,
		WorkspaceID: wsID,
		IsActive:    true,
	}

	if err := s.repo.CreateURL(ctx, url); err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("alias '" + shortCode + "' is already taken")
		}
		return nil, err
	}

	// Cache it immediately
	_ = s.cache.SetURL(ctx, shortCode, req.URL)

	// Generate QR
	fullURL := s.config.App.BaseURL + "/" + shortCode
	png, _ := qrcode.Encode(fullURL, qrcode.Medium, 256)
	qrBase64 := "data:image/png;base64," + b64(png)

	return &model.URLResponse{
		ShortCode:   shortCode,
		ShortURL:    fullURL,
		OriginalURL: req.URL,
		QRCode:      qrBase64,
		CreatedAt:   url.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

func (s *URLService) Resolve(ctx context.Context, shortCode string, ip string, userAgent string) (string, uuid.UUID, error) {
	// 1. Try Redis first (sub-millisecond path)
	cachedVal, err := s.cache.GetURL(ctx, shortCode)
	if err == nil && cachedVal != "" {
		parts := strings.SplitN(cachedVal, "|", 2)
		if len(parts) == 2 {
			id, parseErr := uuid.Parse(parts[0])
			if parseErr == nil {
				return parts[1], id, nil
			}
		}
		// Fallback if cached value is old format (just URL)
		return cachedVal, uuid.Nil, nil
	}

	// 2. Cache miss, go to DB
	url, err := s.repo.GetURLByCode(ctx, shortCode)
	if err != nil {
		return "", uuid.Nil, errors.New("not found")
	}

	// Apply Dynamic Routing if present
	resolvedURL := url.OriginalURL
	
	// Geo-targeting evaluation (V2 requirement)
	if len(url.GeoTargeting) > 0 {
		country := "US" 
		if target, exists := url.GeoTargeting[country]; exists {
			resolvedURL = target.(string)
		}
	}

	// Device-targeting evaluation (V2 requirement)
	if len(url.DeviceTargeting) > 0 {
		device := "desktop"
		if strings.Contains(strings.ToLower(userAgent), "mobile") {
			device = "mobile"
		}
		if target, exists := url.DeviceTargeting[device]; exists {
			resolvedURL = target.(string)
		}
	}

	// 3. Populate cache asynchronously with id|url format
	go func() {
		serialized := url.ID.String() + "|" + resolvedURL
		_ = s.cache.SetURL(context.Background(), shortCode, serialized)
	}()

	return resolvedURL, url.ID, nil
}

func (s *URLService) RecordClick(linkID uuid.UUID, shortCode, ip, userAgent, referrer string) {
	go func() {
		ctx := context.Background()
		
		// 1. Fast Redis increment
		_ = s.cache.RecordClick(ctx, shortCode)

		// Parse user-agent simply (V2 requirements)
		device := "desktop"
		if strings.Contains(strings.ToLower(userAgent), "mobile") {
			device = "mobile"
		}
		browser := "chrome"
		if strings.Contains(strings.ToLower(userAgent), "firefox") {
			browser = "firefox"
		} else if strings.Contains(strings.ToLower(userAgent), "safari") && !strings.Contains(strings.ToLower(userAgent), "chrome") {
			browser = "safari"
		}
		os := "linux"
		if strings.Contains(strings.ToLower(userAgent), "windows") {
			os = "windows"
		} else if strings.Contains(strings.ToLower(userAgent), "macintosh") {
			os = "macos"
		}

		// 2. Persist click to clicks_partitioned
		hash := sha256.Sum256([]byte(ip))
		_ = s.repo.SaveClick(ctx, &model.Click{
			ID:        uuid.New(),
			LinkID:    linkID,
			Timestamp: time.Now(),
			IPHash:    hex.EncodeToString(hash[:]),
			Country:   "US", // Mock IP geolocation
			Device:    device,
			Browser:   browser,
			OS:        os,
			Referrer:  referrer,
			IsUnique:  true,
		})
	}()
}

func (s *URLService) SyncClickCounts(ctx context.Context) error {
	counts, err := s.cache.FlushClickCounts(ctx)
	if err != nil || len(counts) == 0 {
		return err
	}

	logger.Info("Syncing click counts to database", "batch_size", len(counts))
	for code, count := range counts {
		if err := s.repo.SyncClickCount(ctx, code, count); err != nil {
			logger.Error("Failed to sync count", "code", code, "error", err)
		}
	}
	return nil
}

func (s *URLService) GetAnalytics(ctx context.Context, shortCode string) (*model.AnalyticsSummary, error) {
	url, err := s.repo.GetURLByCode(ctx, shortCode)
	if err != nil {
		return nil, err
	}

	count, _, err := s.repo.GetAnalytics(ctx, url.ID.String())
	if err != nil {
		return nil, err
	}

	resp := &model.AnalyticsSummary{
		TotalClicks: count,
		UniqueVisitors: count, // Mock unique visitors
		ClicksByDate: []model.DateCount{
			{Date: time.Now().Format("2006-01-02"), Count: count},
		},
	}

	return resp, nil
}

func generateShortCode(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func b64(b []byte) string {
	return base64.StdEncoding.EncodeToString(b)
}

func (s *URLService) GetUserURLs(ctx context.Context, userID string) ([]model.Link, error) {
	return s.repo.GetUserURLs(ctx, userID)
}

func (s *URLService) GetDashboardAnalytics(ctx context.Context, userID string) (map[string]interface{}, error) {
	return s.repo.GetDashboardAnalytics(ctx, userID)
}
