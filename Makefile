.PHONY: all test build build-worker run run-worker docker-up docker-down clean help

help:
	@echo "Tiktiki Development Commands:"
	@echo "  make test         - Run all backend unit & integration tests with coverage"
	@echo "  make build        - Compile the Go API server binary"
	@echo "  make build-worker - Compile the Go Sniping Worker binary"
	@echo "  make run          - Run the API server locally"
	@echo "  make run-worker   - Run the background Sniping Worker daemon locally"
	@echo "  make docker-up    - Start PostgreSQL and Redis containers with auto-migrations"
	@echo "  make docker-down  - Stop and tear down local containers"
	@echo "  make clean        - Clean temporary artifacts and test caches"

test:
	cd services/api && go test -v -race -coverprofile=coverage.out ./...
	cd services/api && go tool cover -func=coverage.out

build:
	cd services/api && go build -o ../../bin/tiktiki-server cmd/server/main.go

build-worker:
	cd services/api && go build -o ../../bin/tiktiki-worker cmd/worker/main.go

run: build
	./bin/tiktiki-server

run-worker: build-worker
	./bin/tiktiki-worker

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf bin/ services/api/coverage.out /tmp/tiktiki*
