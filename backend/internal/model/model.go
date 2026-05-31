package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// MemberRole represents team member authorization roles
type MemberRole string

const (
	RoleOwner  MemberRole = "owner"
	RoleAdmin  MemberRole = "admin"
	RoleEditor MemberRole = "editor"
	RoleViewer MemberRole = "viewer"
)

// User represents system accounts
type User struct {
	ID           uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string            `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string            `gorm:"column:password;type:varchar(255);not null" json:"-"`
	Name         string            `gorm:"type:varchar(100)" json:"name"`
	Workspaces   []WorkspaceMember `gorm:"foreignKey:UserID" json:"workspaces,omitempty"`
	CreatedAt    time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// Workspace defines shared link structures
type Workspace struct {
	ID        uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string            `gorm:"type:varchar(100);not null" json:"name"`
	Slug      string            `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
	OwnerID   uuid.UUID         `gorm:"type:uuid;not null" json:"owner_id"`
	Members   []WorkspaceMember `gorm:"foreignKey:WorkspaceID" json:"members,omitempty"`
	Links     []Link            `gorm:"foreignKey:WorkspaceID" json:"links,omitempty"`
	Domains   []Domain          `gorm:"foreignKey:WorkspaceID" json:"domains,omitempty"`
	CreatedAt time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// WorkspaceMember represents dynamic role mapping table
type WorkspaceMember struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_ws_user" json:"workspace_id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_ws_user" json:"user_id"`
	Role        MemberRole `gorm:"type:varchar(20);default:'viewer'" json:"role"`
	JoinedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"joined_at"`
}

// Domain represents customizable go.company.com SSL mappings
type Domain struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:uuid;not null" json:"workspace_id"`
	Domain      string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"domain"`
	Verified    bool      `gorm:"default:false" json:"verified"`
	SSLActive   bool      `gorm:"column:ssl_active;default:false" json:"ssl_active"`
	DNSTXTToken string    `gorm:"column:dns_txt_token;type:varchar(255);not null" json:"dns_txt_token"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// Custom JSONB types for dynamic redirects
type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, j)
}

// Link represents the core dynamic link structure
type Link struct {
	ID           uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"workspace_id"`
	UserID       *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	DomainID     *uuid.UUID `gorm:"type:uuid" json:"domain_id,omitempty"`
	ShortCode    string     `gorm:"type:varchar(50);not null;uniqueIndex" json:"short_code"`
	OriginalURL  string     `gorm:"type:text;not null" json:"original_url"`
	Title        string     `gorm:"type:varchar(255)" json:"title,omitempty"`
	Description  string     `gorm:"type:text" json:"description,omitempty"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	MaxClicks    *int       `json:"max_clicks,omitempty"`
	ClickCount   int64      `gorm:"default:0" json:"click_count"`
	PasswordHash *string    `gorm:"column:password_hash" json:"-"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	
	// Dynamic Routing JSONB
	GeoTargeting    JSONB `gorm:"type:jsonb" json:"geo_targeting,omitempty"`
	DeviceTargeting JSONB `gorm:"type:jsonb" json:"device_targeting,omitempty"`
	ABTesting       JSONB `gorm:"type:jsonb" json:"ab_testing,omitempty"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// BioProfile is the Bento-style landing interface
type BioProfile struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:uuid;not null" json:"workspace_id"`
	Username    string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	DisplayName string    `gorm:"type:varchar(100)" json:"display_name"`
	Bio         string    `gorm:"type:text" json:"bio"`
	AvatarURL   string    `gorm:"type:text" json:"avatar_url"`
	ThemeConfig JSONB     `gorm:"type:jsonb" json:"theme_config"`
	Socials     JSONB     `gorm:"type:jsonb" json:"socials"`
	Links       []BioLink `gorm:"foreignKey:ProfileID" json:"links,omitempty"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// BioLink holds specific button URLs inside bio profile pages
type BioLink struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ProfileID uuid.UUID `gorm:"type:uuid;not null" json:"profile_id"`
	Title     string    `gorm:"type:varchar(100);not null" json:"title"`
	URL       string    `gorm:"type:text;not null" json:"url"`
	IconType  string    `gorm:"type:varchar(50)" json:"icon_type,omitempty"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

// APIKey handles secure tokens for developer integrations
type APIKey struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:uuid;not null" json:"workspace_id"`
	Name        string     `gorm:"type:varchar(100);not null" json:"name"`
	KeyPrefix   string     `gorm:"type:varchar(50);not null" json:"key_prefix"`
	KeyHash     string     `gorm:"type:varchar(255);not null;uniqueIndex" json:"-"`
	CreatedAt   time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// Click represents partitioned high-volume metrics table
type Click struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	LinkID    uuid.UUID `gorm:"type:uuid;not null;index" json:"link_id"`
	Timestamp time.Time `gorm:"type:timestamptz;primaryKey" json:"timestamp"`
	IPHash    string    `gorm:"type:varchar(64)" json:"ip_hash"`
	Country   string    `gorm:"type:varchar(3)" json:"country"`
	Region    string    `gorm:"type:varchar(100)" json:"region,omitempty"`
	City      string    `gorm:"type:varchar(100)" json:"city,omitempty"`
	Device    string    `gorm:"type:varchar(50)" json:"device"`
	Browser   string    `gorm:"type:varchar(50)" json:"browser"`
	OS        string    `gorm:"type:varchar(50)" json:"os"`
	Referrer  string    `gorm:"type:varchar(255)" json:"referrer,omitempty"`
	IsUnique  bool      `gorm:"default:true" json:"is_unique"`
}

// End of database models

