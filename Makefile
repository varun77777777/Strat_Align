.PHONY: dev build deploy clean seed

# Run local development environment
dev:
	bash scripts/start-dev.sh

# Run production build sequence
build:
	bash scripts/build.sh

# Deploy using docker-compose
deploy:
	bash scripts/deploy.sh

# Seed the database
seed:
	cd backend && npm run seed

# Clean build artifacts
clean:
	rm -rf frontend/dist
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf ai-service/__pycache__
	rm -rf ai-service/.pytest_cache
