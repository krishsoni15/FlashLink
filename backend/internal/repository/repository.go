package repository

import (
	"context"
	"time"

	"github.com/flashlink/backend/internal/model"
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
