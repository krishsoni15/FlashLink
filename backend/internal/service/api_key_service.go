package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/flashlink/backend/internal/model"
	"github.com/flashlink/backend/internal/repository"
	"github.com/google/uuid"
)

type APIKeyService struct {
	repo *repository.APIKeyRepository
}

func NewAPIKeyService(repo *repository.APIKeyRepository) *APIKeyService {
	return &APIKeyService{repo: repo}
}

type CreateAPIKeyResponse struct {
	ID        uuid.UUID  `json:"id"`
	Name      string     `json:"name"`
	KeyPrefix string     `json:"key_prefix"`
	PlainKey  string     `json:"plain_key"` // Only returned once!
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

func (s *APIKeyService) Create(ctx context.Context, workspaceID uuid.UUID, name string, expiresAt *time.Time) (*CreateAPIKeyResponse, error) {
	// Generate random 32-byte key
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return nil, err
	}
	plainKey := "fl_live_" + hex.EncodeToString(b)
	keyPrefix := plainKey[:10]

	// Hash for storage
	hash := sha256.Sum256([]byte(plainKey))
	keyHash := hex.EncodeToString(hash[:])

	apiKey := &model.APIKey{
		WorkspaceID: workspaceID,
		Name:        name,
		KeyPrefix:   keyPrefix,
		KeyHash:     keyHash,
		ExpiresAt:   expiresAt,
	}

	if err := s.repo.Create(ctx, apiKey); err != nil {
		return nil, err
	}

	return &CreateAPIKeyResponse{
		ID:        apiKey.ID,
		Name:      apiKey.Name,
		KeyPrefix: apiKey.KeyPrefix,
		PlainKey:  plainKey,
		CreatedAt: apiKey.CreatedAt,
		ExpiresAt: apiKey.ExpiresAt,
	}, nil
}

func (s *APIKeyService) List(ctx context.Context, workspaceID string) ([]model.APIKey, error) {
	return s.repo.GetByWorkspace(ctx, workspaceID)
}

func (s *APIKeyService) Delete(ctx context.Context, id, workspaceID string) error {
	return s.repo.Delete(ctx, id, workspaceID)
}
