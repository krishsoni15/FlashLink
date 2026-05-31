package repository

import (
	"context"

	"github.com/flashlink/backend/internal/model"
	"gorm.io/gorm"
)

type APIKeyRepository struct {
	db *gorm.DB
}

func NewAPIKeyRepository(db *gorm.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

func (r *APIKeyRepository) Create(ctx context.Context, key *model.APIKey) error {
	return r.db.WithContext(ctx).Create(key).Error
}

func (r *APIKeyRepository) GetByWorkspace(ctx context.Context, workspaceID string) ([]model.APIKey, error) {
	var keys []model.APIKey
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("created_at desc").Find(&keys).Error
	return keys, err
}

func (r *APIKeyRepository) Delete(ctx context.Context, id string, workspaceID string) error {
	return r.db.WithContext(ctx).Where("id = ? AND workspace_id = ?", id, workspaceID).Delete(&model.APIKey{}).Error
}
