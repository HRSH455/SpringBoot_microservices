# 📌 Start Here: Kubernetes Microservices Implementation

## 📖 Documentation Index


1  **[README.kubernetes.md](README.kubernetes.md)**
   - Detailed setup guide
   - Local dev cluster instructions
   - Production enhancements

---

## 🎯 What This Is

- ✅ Kustomize for DRY manifests (no duplication)
- ✅ ConfigMap/Secrets for externalized config
- ✅ Spring 6 HTTP interfaces (no Feign)
- ✅ Resilience4j (circuit breaker, retry, timeout)
- ✅ OAuth2 + OIDC (Keycloak)
- ✅ Full observability (Prometheus, Grafana, Loki, Tempo)
- ✅ Testcontainers + WireMock integration tests
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Local dev cluster (kind + local registry)

---

## 📂 File Structure

```
k8s/                          # Kubernetes manifests (Kustomize)
├── base/                     # Reusable templates
│   ├── apps/                 # 6 microservices + frontend (replicable templates)
│   ├── infra/                # Databases, Kafka, Keycloak
│   └── observability/        # Prometheus, Grafana, Loki, Tempo
└── overlays/
    ├── dev/                  # 1 replica, latest tags
    └── prod/                 # 2+ replicas, versioned tags

src/main/java/               # Service code
├── order-service/
│   ├── client/InventoryClient.java           # HTTP interface
│   ├── config/HttpClientConfig.java          # RestClient + Resilience4j
│   └── service/OrderService.java
├── api-gateway/
│   └── config/SecurityConfig.java            # OAuth2 resource server
└── microservices-shop-frontend-master/
    └── src/app/
        ├── app.config.ts                     # OIDC config
        └── interceptors/auth.interceptor.ts  # JWT interceptor

Dockerfile.jvm                # Multi-stage Java
Dockerfile (frontend)         # Multi-stage Angular + nginx
kind-setup.sh                # Local cluster setup
.github/workflows/build-deploy.yml  # CI/CD pipeline
```

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
```bash
docker --version      # Docker Desktop or Docker Engine
kubectl version       # kubectl CLI
kind version          # kind (kubernetes-in-docker)
kustomize version     # kustomize
```

### 1. Setup Local Cluster
```bash
chmod +x kind-setup.sh
./kind-setup.sh
```

Output:
```
Creating kind cluster: microservices-dev
Creating local registry: microservices-registry on port 5000
Installing nginx ingress controller...
```

### 2. Update /etc/hosts
Windows: `C:\Windows\System32\drivers\etc\hosts`
Mac/Linux: `/etc/hosts`

Add:
```
127.0.0.1 api.localdev.me
127.0.0.1 frontend.localdev.me
127.0.0.1 keycloak.localdev.me
127.0.0.1 prometheus.localdev.me
127.0.0.1 grafana.localdev.me
```

### 3. Build Images
```bash
docker build -f Dockerfile.jvm -t localhost:5000/api-gateway:latest api-gateway/
docker build -f Dockerfile.jvm -t localhost:5000/product-service:latest product-service/
docker build -f Dockerfile.jvm -t localhost:5000/order-service:latest order-service/
docker build -f Dockerfile.jvm -t localhost:5000/inventory-service:latest inventory-service/
docker build -f Dockerfile.jvm -t localhost:5000/notification-service:latest notification-service/
docker build -f microservices-shop-frontend-master/Dockerfile -t localhost:5000/frontend:latest microservices-shop-frontend-master/
```

### 4. Deploy
```bash
kubectl apply -k k8s/overlays/dev
```

### 5. Access Services
```
API Gateway:  http://api.localdev.me
Frontend:     http://frontend.localdev.me
Keycloak:     http://keycloak.localdev.me (admin/admin)
Prometheus:   http://prometheus.localdev.me
Grafana:      http://grafana.localdev.me (admin/admin)
```

### 6. View Logs
```bash
kubectl logs -n apps -l app=api-gateway -f
kubectl logs -n apps -l app=order-service -f
kubectl logs -n infra -l app=keycloak -f
```

---

## 📊 What Was Generated

| Category | Count | Example |
|----------|-------|---------|
| K8s Manifests | 30+ | `k8s/base/apps/order-service/deployment.yaml` |
| Java Code | 7 | `order-service/.../HttpClientConfig.java` |
| Angular Code | 3 | `microservices-shop-frontend-master/src/app.config.ts` |
| Dockerfiles | 3 | `Dockerfile.jvm` |
| CI/CD | 1 | `.github/workflows/build-deploy.yml` |
| Scripts | 3 | `kind-setup.sh`, `deploy.sh` |
| Documentation | 5 | `README.kubernetes.md`, guides |
| **Total** | **~50 files** | **~2000 lines** |

---

## 🔑 Key Concepts

### 1. Kustomize (DRY Manifests)
 Kustomize provides:
- **Base:** Reusable template (product-service)
- **Overlays:** Environment-specific changes (dev/prod)
- **Patches:** Modify replicas, image tags, resources without editing base

```bash
# Deploy dev (1 replica, latest tag)
kubectl apply -k k8s/overlays/dev

# Deploy prod (3 replicas, v1.2.3 tag)
kubectl apply -k k8s/overlays/prod
```

### 2. ConfigMap + Secrets (Externalized Config)
No hardcoded config in code. Spring Boot reads from K8s:

```yaml
# ConfigMap: application.yml
management:
  tracing:
    sampling:
      probability: 1.0

# Secret: credentials
db-url: jdbc:mysql://mysql-order:3306/order_service
db-password: mysql
```

### 3. HTTP Interface Client (Spring 6+)
Replaces Feign with built-in support:

```java
public interface InventoryClient {
    @GetExchange("/api/inventory/{skuCode}")
    StockResponse isInStock(@PathVariable String skuCode);
}
```

### 4. Resilience4j (Circuit Breaker)
Declarative resilience patterns via ConfigMap:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      inventory-service:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
```

### 5. Security (OAuth2 + OIDC)
API Gateway validates JWT from Keycloak:
- Public: `/actuator/health/**`, `/swagger-ui/**`
- Protected: `/api/**` (require JWT)

Angular authenticates with OIDC and attaches token to HTTP requests.

### 6. Observability
Full stack installed:
- **Prometheus:** Scrapes metrics from pods
- **Grafana:** Dashboards with datasources
- **Loki:** Log aggregation
- **Tempo:** Distributed tracing

---

## 🚀 Next Steps

### For Local Testing
1. Run `kind-setup.sh`
2. Build images
3. Deploy with `kubectl apply -k k8s/overlays/dev`
4. Test services

### For Cloud Deployment
1. Update image registry in overlays
2. Update storage class (EBS/gcePersistentDisk/AzureFile)
3. Configure cloud ingress controller
4. Deploy with `kubectl apply -k k8s/overlays/prod`

### For CI/CD
1. Push `.github/workflows/build-deploy.yml`
2. Configure secrets (KUBE_CONFIG, GITHUB_TOKEN)
3. Push to main branch → auto-builds and deploys

---

## 📚 Key Files Reference

| Purpose | Location | Lines |
|---------|----------|-------|
| Service Template (DRY) | `k8s/base/apps/product-service/` | 150 |
| Gateway Routes | `k8s/base/apps/api-gateway/configmap.yaml` | 80 |
| Ingress Hostnames | `k8s/base/apps/ingress.yaml` | 50 |
| HTTP Client | `order-service/.../InventoryClient.java` | 30 |
| Resilience Config | `order-service/src/main/resources/application.yml` | 100 |
| Gateway Security | `api-gateway/.../SecurityConfig.java` | 80 |
| Angular OIDC | `microservices-shop-frontend-master/src/app.config.ts` | 50 |
| Integration Test | `order-service/.../OrderServiceIntegrationTest.java` | 150 |
| CI/CD Pipeline | `.github/workflows/build-deploy.yml` | 250 |

---

