package service

import (
	"context"
	"fmt"
	"time"

	"github.com/flashlink/backend/internal/config"
	"github.com/flashlink/backend/internal/model"
	"github.com/flashlink/backend/internal/repository"
	"github.com/flashlink/backend/pkg/utils"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo *repository.UserRepository
	config   *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo *repository.UserRepository, config *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		config:   config,
	}
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error) {
	// Check if email exists
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate API key
	apiKey, err := utils.GenerateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	user := &model.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		APIKey:   apiKey,
		IsActive: true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User: model.UserResponse{
			ID:     user.ID.String(),
			Email:  user.Email,
			Name:   user.Name,
			APIKey: user.APIKey,
		},
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(ctx context.Context, req *model.LoginRequest) (*model.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is deactivated")
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User: model.UserResponse{
			ID:     user.ID.String(),
			Email:  user.Email,
			Name:   user.Name,
			APIKey: user.APIKey,
		},
	}, nil
}

// ValidateToken validates a JWT token and returns the user ID
func (s *AuthService) ValidateToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return uuid.Nil, fmt.Errorf("invalid token claims")
	}

	userIDStr, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid user ID in token")
	}

	return uuid.Parse(userIDStr)
}

// ValidateAPIKey validates an API key and returns the user
func (s *AuthService) ValidateAPIKey(ctx context.Context, apiKey string) (*model.User, error) {
	user, err := s.userRepo.FindByAPIKey(ctx, apiKey)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("invalid API key")
	}
	if !user.IsActive {
		return nil, fmt.Errorf("account is deactivated")
	}
	return user, nil
}

// RegenerateAPIKey creates a new API key for a user
func (s *AuthService) RegenerateAPIKey(ctx context.Context, userID uuid.UUID) (string, error) {
	apiKey, err := utils.GenerateAPIKey()
	if err != nil {
		return "", err
	}

	if err := s.userRepo.UpdateAPIKey(ctx, userID, apiKey); err != nil {
		return "", err
	}

	return apiKey, nil
}

// GetUser returns a user by ID
func (s *AuthService) GetUser(ctx context.Context, userID uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	return &model.UserResponse{
		ID:     user.ID.String(),
		Email:  user.Email,
		Name:   user.Name,
		APIKey: user.APIKey,
	}, nil
}

func (s *AuthService) generateToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"iss": s.config.JWT.Issuer,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(time.Duration(s.config.JWT.ExpirationHours) * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.Secret))
}
