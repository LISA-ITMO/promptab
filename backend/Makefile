# PrompTab Backend Makefile
# Usage: make <target>

.PHONY: help install test docs clean run dev build docker-build docker-run

# Default target
help:
	@echo "PrompTab Backend - Available commands:"
	@echo ""
	@echo "Installation:"
	@echo "  install          Install dependencies"
	@echo "  install-dev      Install development dependencies"
	@echo ""
	@echo "Development:"
	@echo "  dev              Run development server"
	@echo "  run              Run production server"
	@echo "  test             Run tests"
	@echo "  test-cov         Run tests with coverage"
	@echo "  lint             Run linting"
	@echo "  format           Format code"
	@echo ""
	@echo "Documentation:"
	@echo "  docs             Build documentation"
	@echo "  docs-serve       Build and serve documentation"
	@echo "  docs-clean       Clean documentation build"
	@echo ""
	@echo "Database:"
	@echo "  db-migrate       Run database migrations"
	@echo "  db-rollback      Rollback last migration"
	@echo "  db-reset         Reset database"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build     Build Docker image"
	@echo "  docker-run       Run Docker container"
	@echo ""
	@echo "Utilities:"
	@echo "  clean            Clean build artifacts"
	@echo "  superuser        Create superuser"

# Installation
install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

# Development
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Testing
test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

test-fast:
	pytest tests/ -x --tb=short

# Linting and formatting
lint:
	flake8 app/ tests/
	black --check app/ tests/
	isort --check-only app/ tests/

format:
	black app/ tests/
	isort app/ tests/

# Documentation
docs:
	./scripts/build_docs.sh

docs-serve:
	./scripts/build_docs.sh -s

docs-clean:
	./scripts/build_docs.sh -c

docs-pdf:
	./scripts/build_docs.sh -t pdf

# Database
db-migrate:
	alembic upgrade head

db-rollback:
	alembic downgrade -1

db-reset:
	alembic downgrade base
	alembic upgrade head

db-revision:
	alembic revision --autogenerate -m "$(message)"

# Docker
docker-build:
	docker build -t promptab-backend .

docker-run:
	docker run -d --name promptab-backend -p 8000:8000 promptab-backend

docker-stop:
	docker stop promptab-backend
	docker rm promptab-backend

# Utilities
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf docs/_build/

superuser:
	python -m app.scripts.create_superuser

# Health checks
health:
	curl -f http://localhost:8000/health || echo "Service is not running"

health-db:
	curl -f http://localhost:8000/health/db || echo "Database health check failed"

health-redis:
	curl -f http://localhost:8000/health/redis || echo "Redis health check failed"

# Monitoring
metrics:
	curl http://localhost:8000/metrics

# Development setup
setup-dev: install-dev
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.example .env; \
		echo "Please update .env with your configuration"; \
	fi
	@echo "Development environment setup complete!"

# Production setup
setup-prod: install
	@echo "Setting up production environment..."
	@echo "Please ensure all environment variables are set"
	@echo "Production environment setup complete!"

# Quick start
quickstart: setup-dev db-migrate superuser
	@echo "PrompTab Backend is ready!"
	@echo "Run 'make dev' to start the development server"
	@echo "Visit http://localhost:8000/docs for API documentation"

# CI/CD
ci-install:
	pip install -r requirements.txt
	pip install -r requirements-test.txt

ci-test:
	pytest tests/ --cov=app --cov-report=xml --cov-fail-under=80

ci-lint:
	flake8 app/ tests/
	black --check app/ tests/
	isort --check-only app/ tests/

ci-docs:
	./scripts/build_docs.sh -c

# Backup and restore
backup:
	@echo "Creating database backup..."
	pg_dump $(DATABASE_URL) > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file name: " backup_file; \
	psql $(DATABASE_URL) < $$backup_file

# Performance
profile:
	python -m cProfile -o profile.stats -m app.main

profile-view:
	python -c "import pstats; pstats.Stats('profile.stats').sort_stats('cumulative').print_stats(20)"

# Security
security-check:
	bandit -r app/
	safety check

# Dependencies
update-deps:
	pip install --upgrade pip
	pip install --upgrade -r requirements.txt
	pip freeze > requirements.txt

# Logs
logs:
	tail -f logs/app.log

logs-error:
	tail -f logs/error.log

# Environment
env-check:
	@echo "Checking environment variables..."
	@python -c "import os; from app.core.config import settings; print('Environment check passed')"

# Helpers
.PHONY: help-all
help-all: help
	@echo ""
	@echo "Additional targets:"
	@echo "  setup-dev         Setup development environment"
	@echo "  setup-prod        Setup production environment"
	@echo "  quickstart        Quick setup for development"
	@echo "  ci-install        CI installation"
	@echo "  ci-test           CI testing"
	@echo "  ci-lint           CI linting"
	@echo "  backup            Backup database"
	@echo "  restore           Restore database"
	@echo "  profile           Profile performance"
	@echo "  security-check    Security audit"
	@echo "  update-deps       Update dependencies"
	@echo "  logs              View application logs"
	@echo "  env-check         Check environment variables" 