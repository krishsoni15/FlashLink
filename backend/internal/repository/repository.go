package repository

import (
	"context"
	"time"

	"github.com/flashlink/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase(dsn string) (*gorm.DB, error) {
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error), // Minimal logging for perf
		SkipDefaultTransaction: true, // Disable transactions for simple inserts for 30% perf boost
		PrepareStmt:            true, // Cache prepared statements
	}

	db, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Performance tuned connection pooling
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetMaxIdleConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&model.User{},
		&model.Workspace{},
		&model.WorkspaceMember{},
		&model.Domain{},
		&model.Link{},
		&model.BioProfile{},
		&model.BioLink{},
		&model.APIKey{},
	)
}

func (r *Repository) CreateURL(ctx context.Context, url *model.Link) error {
	return r.db.WithContext(ctx).Create(url).Error
}

func (r *Repository) GetURLByCode(ctx context.Context, code string) (*model.Link, error) {
	var url model.Link
	err := r.db.WithContext(ctx).Select("id, short_code, original_url").Where("short_code = ?", code).First(&url).Error
	if err != nil {
		return nil, err
	}
	return &url, nil
}

func (r *Repository) SaveClick(ctx context.Context, click *model.Click) error {
	return r.db.WithContext(ctx).Create(click).Error
}

func (r *Repository) SyncClickCount(ctx context.Context, shortCode string, count int64) error {
	return r.db.WithContext(ctx).Model(&model.Link{}).Where("short_code = ?", shortCode).Update("click_count", gorm.Expr("click_count + ?", count)).Error
}

func (r *Repository) GetAnalytics(ctx context.Context, urlID string) (int64, []model.Click, error) {
	var url model.Link
	if err := r.db.WithContext(ctx).Where("id = ?", urlID).First(&url).Error; err != nil {
		return 0, nil, err
	}

	var clicks []model.Click
	err := r.db.WithContext(ctx).Where("link_id = ?", urlID).Order("timestamp desc").Limit(50).Find(&clicks).Error
	return url.ClickCount, clicks, err
}

func (r *Repository) GetUserURLs(ctx context.Context, userID string) ([]model.Link, error) {
	var links []model.Link
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&links).Error
	return links, err
}

func (r *Repository) GetDashboardAnalytics(ctx context.Context, userID string) (map[string]interface{}, error) {
	var totalLinks int64
	var totalClicks int64
	
	r.db.WithContext(ctx).Model(&model.Link{}).Where("user_id = ?", userID).Count(&totalLinks)
	r.db.WithContext(ctx).Model(&model.Link{}).Where("user_id = ?", userID).Select("COALESCE(SUM(click_count), 0)").Scan(&totalClicks)

	return map[string]interface{}{
		"total_urls": totalLinks,
		"total_clicks": totalClicks,
		"unique_visitors": totalClicks,
		"clicks_by_date": []interface{}{
			map[string]interface{}{"date": time.Now().Format("2006-01-02"), "count": totalClicks},
		},
		"top_countries": []interface{}{},
		"top_browsers": []interface{}{},
		"top_devices": []interface{}{},
		"top_os": []interface{}{},
		"top_referers": []interface{}{},
	}, nil
}

func (r *Repository) FindOrCreateWorkspace(ctx context.Context, userID uuid.UUID) (uuid.UUID, error) {
	var ws model.Workspace
	err := r.db.WithContext(ctx).Where("owner_id = ?", userID).First(&ws).Error
	if err == nil {
		return ws.ID, nil
	}

	newWs := model.Workspace{
		ID:      uuid.New(),
		Name:    "My Workspace",
		Slug:    "workspace-" + uuid.New().String()[:8],
		OwnerID: userID,
	}
	if err := r.db.WithContext(ctx).Create(&newWs).Error; err != nil {
		return uuid.Nil, err
	}
	return newWs.ID, nil
}
