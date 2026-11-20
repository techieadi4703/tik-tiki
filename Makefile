.PHONY: all test build run docker-up docker-down clean help

help:
	@echo "Tiktiki Development Commands:"
	@echo "  make test        - Run all backend unit & integration tests with coverage"
	@echo "  make build       - Compile the Go API binary"
	@echo "  make run         - Run the API server locally"
	@echo "  make docker-up   - Start PostgreSQL and Redis containers with auto-migrations"
	@echo "  make docker-down - Stop and tear down local containers"
	@echo "  make clean       - Clean temporary artifacts and test caches"

test:
	cd services/api && go test -v -race -coverprofile=coverage.out ./...
	cd services/api && go tool cover -func=coverage.out

build:
	cd services/api && go build -o ../../bin/tiktiki-server cmd/server/main.go

run: build
	./bin/tiktiki-server

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf bin/ services/api/coverage.out /tmp/tiktiki*
