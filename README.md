# Spring Boot Microservices with Kubernetes

A production-ready microservices architecture built with Spring Boot 3, featuring modern cloud-native patterns, comprehensive observability, and Kubernetes deployment.

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        INGRESS (nginx)                           │
│         api.localdev.me │ frontend.localdev.me                   │
└────────────┬───────────────────────────┬──────────────────────────┘
             │                           │
         ┌───▼────────────┐          ┌──▼──────────────┐
         │  API Gateway   │          │  Angular SPA    │
         │  (Port 9000)   │          │  (Port 80)      │
         └───┬───┬────┬───┘          └─────────────────┘
             │   │    │
    ┌────────┘   │    └──────────┐
    │            │               │
┌───▼───────┐ ┌──▼──────┐ ┌──────▼──┐
│ Product   │ │ Order   │ │Inventory│
│ Service   │ │ Service │ │ Service │
│(MongoDB)  │ │(MySQL)  │ │(MySQL)  │
└───────────┘ └────┬────┘ └─────────┘
                   │
                   │(Kafka)
                   │
              ┌────▼──────────┐
              │Notification   │
              │Service        │
              └───────────────┘

Infrastructure Layer:
├─ Keycloak (OIDC/OAuth2 Authentication)
├─ Kafka + Zookeeper (Event Streaming)
├─ MySQL (Order & Inventory Services)
└─ MongoDB (Product Service)

Observability Stack:
├─ Prometheus (Metrics Collection)
├─ Grafana (Visualization & Dashboards)
├─ Loki (Log Aggregation)
└─ Tempo (Distributed Tracing)
```

## ✨ Key Features

### 🏛️ Architecture & Design
- **Microservices Pattern**: 5 independent services with clear boundaries
- **Database-per-Service**: MongoDB for products, MySQL for transactions
- **Event-Driven Communication**: Kafka for async service communication
- **API Gateway**: Centralized routing with circuit breaker protection
- **Kustomize**: DRY Kubernetes manifests with environment overlays

### 🔒 Security & Authentication
- **OAuth2 + OIDC**: Keycloak integration for authentication
- **JWT Tokens**: Secure API communication
- **Resource Server**: Protected microservices endpoints

### 📊 Observability & Monitoring
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards for visualization
- **Loki**: Centralized logging
- **Tempo**: Distributed tracing
- **Health Checks**: Spring Boot Actuator endpoints

### 🛠️ Development & DevOps
- **Spring Boot 3.4.1**: Latest Spring ecosystem
- **Java 21**: Modern JVM features and performance
- **Docker**: Containerized deployment
- **Kubernetes**: Production orchestration
- **CI/CD**: GitHub Actions pipeline
- **Testcontainers**: Integration testing
- **WireMock**: API mocking for tests

### 📱 Frontend
- **Angular**: Modern SPA with TypeScript
- **Tailwind CSS**: Utility-first styling
- **OIDC Integration**: Seamless authentication flow

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** or Docker Engine
- **kubectl** CLI tool
- **kind** (Kubernetes-in-Docker)
- **kustomize** for manifest management

### 1. Setup Local Kubernetes Cluster
```bash
chmod +x kind-setup.sh
./kind-setup.sh
```

### 2. Update Hosts File
**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

Add these entries:
```
127.0.0.1 api.localdev.me
127.0.0.1 frontend.localdev.me
127.0.0.1 keycloak.localdev.me
127.0.0.1 prometheus.localdev.me
127.0.0.1 grafana.localdev.me
```

### 3. Build Docker Images
```bash
# Build microservices
docker build -f Dockerfile.jvm -t localhost:5000/api-gateway:latest api-gateway/
docker build -f Dockerfile.jvm -t localhost:5000/product-service:latest product-service/
docker build -f Dockerfile.jvm -t localhost:5000/order-service:latest order-service/
docker build -f Dockerfile.jvm -t localhost:5000/inventory-service:latest inventory-service/
docker build -f Dockerfile.jvm -t localhost:5000/notification-service:latest notification-service/

# Build frontend
docker build -f microservices-shop-frontend-master/Dockerfile -t localhost:5000/frontend:latest microservices-shop-frontend-master/
```

### 4. Deploy to Kubernetes
```bash
kubectl apply -k k8s/overlays/dev
```

### 5. Access the Application
- **API Gateway**: http://api.localdev.me
- **Frontend**: http://frontend.localdev.me
- **Keycloak**: http://keycloak.localdev.me (admin/admin)
- **Prometheus**: http://prometheus.localdev.me
- **Grafana**: http://grafana.localdev.me (admin/admin)

## 🏃‍♂️ Development Setup

### Local Development with Docker Compose

Each service includes a `docker-compose.yml` for local development:

```bash
# Start individual services
cd api-gateway && docker-compose up -d
cd product-service && docker-compose up -d
cd order-service && docker-compose up -d
cd inventory-service && docker-compose up -d
cd notification-service && docker-compose up -d

# Start frontend
cd microservices-shop-frontend-master && npm install && ng serve
```

### Running Tests
```bash
# Run all tests with Maven
mvn test

# Run with Testcontainers (requires Docker)
mvn test -Dspring.profiles.active=test
```

### Building the Project
```bash
# Build all services
mvn clean package -DskipTests

# Build Docker images
docker-compose build
```

## 📋 API Documentation

### API Gateway Endpoints
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/orders` - List user orders
- `POST /api/orders` - Create new order
- `GET /api/inventory/{productId}` - Check product inventory

### Service Ports (Internal)
- API Gateway: 9000
- Product Service: 8081
- Order Service: 8082
- Inventory Service: 8083
- Notification Service: 8084

### Health Checks
- `GET /actuator/health` - Service health status
- `GET /actuator/metrics` - Application metrics
- `GET /actuator/info` - Service information

## 🐳 Docker Deployment

### Multi-stage Dockerfiles
- `Dockerfile.jvm` - Multi-stage Java build for microservices
- `microservices-shop-frontend-master/Dockerfile` - Multi-stage Angular + nginx

### Docker Compose
- Individual service composition for development
- Full stack composition with infrastructure

## ☸️ Kubernetes Deployment

### Directory Structure
```
k8s/
├── base/                     # Reusable templates
│   ├── apps/                 # Microservices + frontend
│   ├── infra/                # Databases, Kafka, Keycloak
│   └── observability/        # Monitoring stack
└── overlays/
    ├── dev/                  # Development environment
    └── prod/                 # Production environment
```

### Environment Overlays
- **Dev**: Single replicas, latest image tags, minimal resources
- **Prod**: Multiple replicas, versioned tags, production resources

### Deploy Commands
```bash
# Development
kubectl apply -k k8s/overlays/dev

# Production
kubectl apply -k k8s/overlays/prod
```

## 🔍 Monitoring & Observability

### Accessing Monitoring Tools
- **Grafana**: http://grafana.localdev.me (admin/admin)
- **Prometheus**: http://prometheus.localdev.me
- **Keycloak Admin**: http://keycloak.localdev.me (admin/admin)

### Log Aggregation
```bash
# View service logs
kubectl logs -n apps -l app=api-gateway -f
kubectl logs -n apps -l app=order-service -f

# View infrastructure logs
kubectl logs -n infra -l app=keycloak -f
```

## 📚 Additional Resources

- [START_HERE.md](START_HERE.md) - Quick start guide
- [README.kubernetes.md](README.kubernetes.md) - Detailed Kubernetes setup
- [CODE_REVIEW.md](CODE_REVIEW.md) - Comprehensive code review
- [api-gateway/HELP.md](api-gateway/HELP.md) - API Gateway documentation
- [inventory_service/HELP.md](inventory_service/HELP.md) - Inventory service docs
- [order-service/HELP.md](order-service/HELP.md) - Order service documentation
- [product-service/HELP.md](product-service/HELP.md) - Product service docs
- [notification-service/HELP.md](notification-service/HELP.md) - Notification service docs

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 9000-8084 are available
2. **Hosts file**: Update `/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`
3. **Docker resources**: Ensure sufficient CPU/memory allocation
4. **Kubernetes context**: Verify `kubectl config current-context`

### Getting Help
- Check service logs: `kubectl logs -n apps deployment/<service-name>`
- Verify pod status: `kubectl get pods -n apps`
- Check events: `kubectl get events -n apps`</content>
<parameter name="filePath">c:\Users\bommi\Desktop\work\SpringBoot_microservices\README.md