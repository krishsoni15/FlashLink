package model

// --- Request DTOs ---

type CreateURLRequest struct {
	URL         string `json:"url" binding:"required,url,max=2048"`
	CustomAlias string `json:"custom_alias,omitempty" binding:"omitempty,min=3,max=50,alphanum"`
	ExpiresIn   int    `json:"expires_in,omitempty"` // days
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8,max=128"`
	Name     string `json:"name" binding:"required,min=2,max=255"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// --- Response DTOs ---

type URLResponse struct {
	ID          string `json:"id"`
	ShortCode   string `json:"short_code"`
	ShortURL    string `json:"short_url"`
	OriginalURL string `json:"original_url"`
	ClickCount  int64  `json:"click_count"`
	QRCode      string `json:"qr_code,omitempty"`
	ExpiresAt   string `json:"expires_at,omitempty"`
	CreatedAt   string `json:"created_at"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID     string `json:"id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	APIKey string `json:"api_key,omitempty"`
}

type AnalyticsSummary struct {
	TotalClicks    int64              `json:"total_clicks"`
	UniqueVisitors int64              `json:"unique_visitors"`
	TopCountries   []CountStat        `json:"top_countries"`
	TopBrowsers    []CountStat        `json:"top_browsers"`
	TopDevices     []CountStat        `json:"top_devices"`
	TopOS          []CountStat        `json:"top_os"`
	ClicksByDate   []DateCount        `json:"clicks_by_date"`
	TopReferers    []CountStat        `json:"top_referers"`
}

type CountStat struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type DateCount struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Redis    string `json:"redis"`
	Version  string `json:"version"`
	Uptime   string `json:"uptime"`
}
