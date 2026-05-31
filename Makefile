.PHONY: all build run dev test clean docker-up docker-down migrate

# Variables
BINARY_NAME=flashlink
BACKEND_DIR=./backend
FRONTEND_DIR=./frontend

# ─── Development ──────────────────────────────────────

dev: ## Start all services for development
	@echo "🚀 Starting FlashLink development environment..."
	docker compose up postgres redis -d
	@sleep 3
	@echo "📦 Starting backend..."
	cd $(BACKEND_DIR) && go run ./cmd/server &
	@echo "🌐 Starting frontend..."
	cd $(FRONTEND_DIR) && npm run dev

dev-backend: ## Start only the backend
	cd $(BACKEND_DIR) && go run ./cmd/server

dev-frontend: ## Start only the frontend
	cd $(FRONTEND_DIR) && npm run dev

# ─── Build ────────────────────────────────────────────

build-backend: ## Build Go backend
	cd $(BACKEND_DIR) && CGO_ENABLED=0 go build -ldflags="-w -s" -o ../bin/$(BINARY_NAME) ./cmd/server

build-frontend: ## Build Next.js frontend
	cd $(FRONTEND_DIR) && npm run build

build: build-backend build-frontend ## Build everything

# ─── Docker ───────────────────────────────────────────

docker-up: ## Start all containers
	docker compose up --build -d

docker-down: ## Stop all containers
	docker compose down

docker-logs: ## View logs
	docker compose logs -f

docker-restart: ## Restart all containers
	docker compose restart

# ─── Database ─────────────────────────────────────────

db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U flashlink -d flashlink

redis-shell: ## Open Redis shell
	docker compose exec redis redis-cli

# ─── Testing ─────────────────────────────────────────

test: ## Run backend tests
	cd $(BACKEND_DIR) && go test ./... -v

# ─── Utilities ────────────────────────────────────────

clean: ## Clean build artifacts
	rm -rf bin/
	cd $(FRONTEND_DIR) && rm -rf .next node_modules

tidy: ## Tidy Go modules
	cd $(BACKEND_DIR) && go mod tidy

deps: ## Install all dependencies
	cd $(BACKEND_DIR) && go mod download
	cd $(FRONTEND_DIR) && npm install

setup: ## First-time setup
	cp .env.example .env
	$(MAKE) deps
	@echo "✅ Setup complete! Edit .env with your configuration, then run 'make dev'"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
