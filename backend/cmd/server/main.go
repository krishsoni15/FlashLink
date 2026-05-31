package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/flashlink/backend/internal/cache"
	"github.com/flashlink/backend/internal/config"
	"github.com/flashlink/backend/internal/handler"
	"github.com/flashlink/backend/internal/middleware"
	"github.com/flashlink/backend/internal/repository"
	"github.com/flashlink/backend/internal/service"
	"github.com/flashlink/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger.Init(cfg.Server.Mode)
	defer logger.Cleanup()

	// 1. Initialize PostgreSQL
	db, err := repository.NewDatabase(cfg.Database.DSN())
	if err != nil {
		logger.Fatal("Failed to connect to database", "error", err)
	}

	// Get underlying sql.DB to defer close
	if sqlDB, err := db.DB(); err == nil {
		defer sqlDB.Close()
	}

	repo := repository.NewRepository(db)
	if err := repo.AutoMigrate(); err != nil {
		logger.Fatal("Failed to run migrations", "error", err)
	}

	userRepo := repository.NewUserRepository(db)
	apiKeyRepo := repository.NewAPIKeyRepository(db)

	// 2. Initialize Redis
	redisCache, err := cache.NewRedisCache(&cfg.Redis)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", "error", err)
	}
	defer redisCache.Close()

	// 3. Initialize Services
	urlService := service.NewURLService(repo, redisCache, cfg)
	authService := service.NewAuthService(userRepo, cfg)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo)

	// 4. Initialize Handlers
	urlHandler := handler.NewURLHandler(urlService)
	authHandler := handler.NewAuthHandler(authService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)

	gin.SetMode(cfg.Server.Mode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.LoggerMiddleware())

	// Super minimal middleware for CORS
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Absolute fastest path for redirect (No other middlewares)
	router.GET("/:shortCode", urlHandler.RedirectURL)

	// API Routes
	api := router.Group("/api/v1")
	
	// Auth routes (Public)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(authService))
	{
		protected.GET("/auth/me", authHandler.GetProfile)
		
		protected.POST("/urls", urlHandler.CreateShortURL)
		protected.GET("/urls", urlHandler.GetUserURLs)
		protected.DELETE("/urls/:id", urlHandler.DeleteURL)
		protected.GET("/urls/:shortCode/analytics", urlHandler.GetAnalytics)
		
		protected.GET("/stats", urlHandler.GetUserStats)
		protected.GET("/analytics/dashboard", urlHandler.GetDashboardAnalytics)
		
		protected.POST("/api-keys", apiKeyHandler.Create)
		protected.GET("/api-keys", apiKeyHandler.List)
		protected.DELETE("/api-keys/:id", apiKeyHandler.Delete)
	}

	// Background worker for syncing clicks from Redis to Postgres
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		ticker := time.NewTicker(5 * time.Second) // Fast sync for demo purposes
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := urlService.SyncClickCounts(context.Background()); err != nil {
					logger.Error("Failed to sync click counts", "error", err)
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	go func() {
		logger.Info("FlashLink V2 Server running", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed to start", "error", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down FlashLink server...")
	_ = urlService.SyncClickCounts(context.Background())
	_ = srv.Shutdown(context.Background())
}
