package cache

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	"github.com/flashlink/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(cfg *config.RedisConfig) (*RedisCache, error) {
	opts := &redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     100, // Large pool for high concurrency
		MinIdleConns: 20,
	}

	// Enable TLS for cloud Redis providers (Upstash, etc.)
	if cfg.UseTLS {
		opts.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisCache{client: client}, nil
}

func (c *RedisCache) Close() error {
	return c.client.Close()
}

// SetURL caches the original URL for a short code.
func (c *RedisCache) SetURL(ctx context.Context, shortCode, originalURL string) error {
	// Cache for 24 hours
	return c.client.Set(ctx, "url:"+shortCode, originalURL, 24*time.Hour).Err()
}

// GetURL retrieves the original URL. This is the absolute hot path.
func (c *RedisCache) GetURL(ctx context.Context, shortCode string) (string, error) {
	return c.client.Get(ctx, "url:"+shortCode).Result()
}

// RecordClick increments the click counter in Redis.
func (c *RedisCache) RecordClick(ctx context.Context, shortCode string) error {
	return c.client.Incr(ctx, "clicks:"+shortCode).Err()
}

// FlushClickCounts extracts all click counters and resets them to 0 atomically.
func (c *RedisCache) FlushClickCounts(ctx context.Context) (map[string]int64, error) {
	// Find all click counters
	keys, err := c.client.Keys(ctx, "clicks:*").Result()
	if err != nil || len(keys) == 0 {
		return nil, err
	}

	counts := make(map[string]int64)
	
	// Pipeline to GET and DEL atomically to avoid losing counts
	pipe := c.client.Pipeline()
	var cmds []*redis.StringCmd
	
	for _, key := range keys {
		cmds = append(cmds, pipe.GetSet(ctx, key, "0"))
	}
	
	_, err = pipe.Exec(ctx)
	if err != nil {
		return nil, err
	}

	for i, cmd := range cmds {
		val, _ := cmd.Int64()
		if val > 0 {
			code := keys[i][7:] // strip "clicks:" prefix
			counts[code] = val
		}
	}

	return counts, nil
}
