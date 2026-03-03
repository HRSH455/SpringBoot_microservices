# Modern Kubernetes Microservices Architecture

A production-ready refactor of the Spring Boot 3 microservices project with Kubernetes, modern service communication patterns, security, observability, and resilience.

## Architecture Overview

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

Infra Layer:
├─ Keycloak (OIDC/OAuth2)
├─ Kafka + Zookeeper
├─ MySQL (order, inventory)
└─ MongoDB (product)

Observability:
├─ Prometheus (metrics)
├─ Grafana (dashboards)
├─ Loki (logs)
└─ Tempo (traces)
```

## Quick Start (Local Dev with kind)

### Prerequisites
- Docker
- kind (kubernetes-in-docker)
- kubectl
- Helm (optional, for future enhancements)

### 1. Setup kind cluster and local registry
```bash
chmod +x kind-setup.sh
./kind-setup.sh
```

This creates:
- `microservices-dev` kind cluster
- Local Docker registry on `localhost:5000`
- nginx ingress controller

### 2. Update /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows)
```
127.0.0.1 api.localdev.me
127.0.0.1 frontend.localdev.me
127.0.0.1 keycloak.localdev.me
127.0.0.1 prometheus.localdev.me
127.0.0.1 grafana.localdev.me
```

### 3. Build and push images to local registry
```bash
# Build each service Dockerfile
docker build -f Dockerfile.jvm -t localhost:5000/product-service:latest product-service/
docker build -f Dockerfile.jvm -t localhost:5000/order-service:latest order-service/
docker build -f Dockerfile.jvm -t localhost:5000/api-gateway:latest api-gateway/
docker build -f Dockerfile.jvm -t localhost:5000/inventory-service:latest inventory-service/
docker build -f Dockerfile.jvm -t localhost:5000/notification-service:latest notification-service/
docker build -f microservices-shop-frontend-master/Dockerfile -t localhost:5000/frontend:latest microservices-shop-frontend-master/

# Push to registry
for service in product-service order-service api-gateway inventory-service notification-service frontend; do
  docker push localhost:5000/$service:latest
done
```

### 4. Deploy to Kubernetes
```bash
# Deploy all resources (dev overlay)
kubectl apply -k k8s/overlays/dev

# Or deploy specific components
kubectl apply -k k8s/base/infra  # Databases, Kafka, Keycloak
kubectl apply -k k8s/base/apps   # Microservices + frontend
kubectl apply -k k8s/base/observability  # Prometheus, Grafana, Loki, Tempo
```

### 5. Verify deployment
```bash
# Check pods
kubectl get pods -n apps
kubectl get pods -n infra
kubectl get pods -n observability

# Check services
kubectl get svc -n apps
kubectl get svc -n infra

# Check ingress
kubectl get ingress -n apps
```

### 6. Access services
- **API Gateway**: http://api.localdev.me
- **Frontend**: http://frontend.localdev.me
- **Keycloak**: http://keycloak.localdev.me (admin/admin)
- **Grafana**: http://grafana.localdev.me (admin/admin)
- **Prometheus**: http://prometheus.localdev.me

## Directory Structure

```
k8s/
├─ base/
│  ├─ apps/
│  │  ├─ product-service/       # Replicable template with Deployment, Service, ConfigMap, Secret
│  │  ├─ order-service/         # Template showing Resilience4j config
│  │  ├─ inventory-service/
│  │  ├─ notification-service/
│  │  ├─ api-gateway/           # Gateway with Spring Cloud Gateway routes
│  │  ├─ frontend/
│  │  ├─ kustomization.yaml     # Combines all app services
│  │  └─ ingress.yaml           # nginx Ingress for all hostnames
│  ├─ infra/
│  │  ├─ databases/             # MongoDB StatefulSet + MySQL StatefulSets
│  │  ├─ kafka/                 # Kafka + Zookeeper
│  │  └─ keycloak/              # Keycloak + MySQL
│  ├─ observability/
│  │  ├─ prometheus.yaml        # With ServiceMonitor aggregation
│  │  ├─ grafana.yaml           # With datasources pointing to prometheus/loki/tempo
│  │  ├─ loki.yaml
│  │  └─ tempo.yaml
│  ├─ namespaces.yaml
│  └─ kustomization.yaml
├─ overlays/
│  ├─ dev/
│  │  └─ kustomization.yaml     # 1 replica, lower resources, latest tags
│  └─ prod/
│     └─ kustomization.yaml     # 2+ replicas, higher resources, versioned tags

ci-cd/
├─ .github/
│  └─ workflows/
│     └─ build-deploy.yml       # Build Java/Angular, push to GHCR, deploy to cluster

Dockerfile.jvm                    # Multi-stage for Java services
microservices-shop-frontend-master/Dockerfile  # Multi-stage for Angular + nginx
```

## Key Concepts

### 1. Kustomize for DRY Configuration Management

**Advantages:**
- ✅ Reusable bases (product-service template used for order, inventory services)
- ✅ Common labels/annotations applied site-wide
- ✅ Resource limits/requests standardized
- ✅ Overlays for dev/prod (resource scaling, image tags, replicas)
- ✅ Patch-based customization (no duplication)

**Usage:**
```bash
# Dev deployment
kubectl apply -k k8s/overlays/dev

# Prod deployment (higher replicas, production image tags)
kubectl apply -k k8s/overlays/prod

# Preview manifests
kustomize build k8s/overlays/dev | less
```

### 2. Externalized Configuration (ConfigMap + Secrets)

**Spring Boot gets config from K8s objects, NOT hardcoded:**

**ConfigMap (application.yml):**
```yaml
# k8s/base/apps/order-service/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-config
data:
  application.yml: |
    spring:
      datasource:
        hikari:
          maximum-pool-size: 10
    server:
      port: 8081
    management:
      tracing:
        sampling:
          probability: 1.0
```

**Secret (credentials):**
```yaml
# k8s/base/apps/order-service/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: credentials
stringData:
  db-url: jdbc:mysql://mysql-order:3306/order_service
  db-username: root
  db-password: mysql  # Change to secure secret store in prod (Vault, AWS Secrets Manager)
```

**Pod references in Deployment:**
```yaml
env:
  - name: SPRING_DATASOURCE_URL
    valueFrom:
      secretKeyRef:
        name: credentials
        key: db-url
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://tempo:4317"  # K8s cluster DNS
```

**Spring Boot application.yml can use environment variables:**
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
```

### 3. HTTP Interface Clients (RestClient + Spring 6.0+)

**Replaces Feign with modern Spring approach:**

```java
// Define HTTP interface
public interface InventoryClient {
    @GetExchange("/api/inventory/{skuCode}")
    StockResponse isInStock(@PathVariable String skuCode);
}

// Create proxy with RestClient
@Bean
public InventoryClient inventoryClient(RestClient restClient) {
    return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()
            .createClient(InventoryClient.class);
}

// Use in service
@Service
public class OrderService {
    public void placeOrder(String sku) {
        InventoryClient.StockResponse stock = inventoryClient.isInStock(sku);
    }
}
```

### 4. Resilience4j Circuit Breaker, Retry, Timeout

**K8s ConfigMap config for services:**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      inventory-service:
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
  retry:
    instances:
      inventory-service:
        maxAttempts: 3
        waitDuration: 1000
  timeout:
    instances:
      inventory-service:
        timeoutDuration: 5s
```

**Decorated HTTP client:**
```java
InventoryClient client = circuitBreaker.executeSupplier(
    () -> Retry.decorateSupplier(retry,
            () -> delegate.isInStock(sku)).get()
);
```

### 5. API Gateway with Spring Cloud Gateway

**Routes with circuit breaker:**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: product-service
          uri: http://product-service:8080
          predicates:
            - Path=/api/products/**
          filters:
            - RewritePath=/api/(?<segment>.*), /$\{segment}
            - name: CircuitBreaker
              args:
                name: productCircuitBreaker
```

### 6. Security: OAuth2 + Keycloak OIDC

**API Gateway SecurityConfig:**
```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange()
            .pathMatchers("/actuator/health/**", "/swagger-ui/**").permitAll()
            .pathMatchers("/api/**").authenticated()
            .oauth2ResourceServer()
            .jwt()
            .jwtDecoder(jwtDecoder(keycloakIssuerUri));
    }
}
```

**Angular OIDC integration:**
```typescript
// app.config.ts
import { AuthModule } from 'angular-auth-oidc-client';

export const appConfig = {
  providers: [
    importProvidersFrom(
      AuthModule.forRoot({
        config: {
          authority: 'http://keycloak.localdev.me/realms/...',
          clientId: 'spring-cloud-client',
          responseType: 'code',
          scope: 'openid profile email',
          silentRenew: true,
        }
      })
    )
  ]
};
```

**HTTP Interceptor to attach token:**
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.oidcService.getAccessToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(req);
  }
}
```

### 7. Observability: Prometheus, Grafana, Loki, Tempo

**Spring Boot exposes metrics at `/actuator/prometheus`:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
  tracing:
    sampling:
      probability: 1.0
  otlp:
    tracing:
      endpoint: http://tempo:4317
```

**Prometheus scrapes via pod annotations:**
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/actuator/prometheus"
```

**Grafana datasources (ConfigMap):**
```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
  - name: Loki
    type: loki
    url: http://loki:3100
  - name: Tempo
    type: tempo
    url: http://tempo:3200
```


## CI/CD Pipeline (GitHub Actions)

**.github/workflows/build-deploy.yml:**
1. Build all Java services with Maven
2. Build Angular frontend with npm
3. Push Docker images to GitHub Container Registry (GHCR)
4. Deploy to Kubernetes using Kustomize
5. Run smoke tests (health checks)

**Deployment triggers:**
- Push to `main` branch → deploy to prod
- Push to `develop` branch → deploy to dev
- Pull requests → build only (no deploy)

## Scaling to Cloud (AWS/GCP/Azure)

**Design principles maintain portability:**

1. **Stateless services:** Scale replicas easily
2. **ConfigMap-based config:** Switch DB endpoints (RDS, Cloud SQL)
3. **PersistentVolume Claims:** Cloud storage (EBS, gcePersistentDisk, AzureFile)
4. **ImagePullSecrets:** Use managed image registries (ECR, Artifact Registry, ACR)
5. **Namespace isolation:** Deploy dev/staging/prod in separate namespaces or clusters
6. **Ingress controller:** Swap nginx for cloud-native ALB/GCP Cloud Load Balancer

**Example for AWS:**
```yaml
# Use AWS-specific storage class
storageClassName: gp2  # EBS

# Use AWS-managed Secrets Manager
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aws-secret
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "prod/db-password"
        objectType: "secretsmanager"
        objectAlias: "db-password"
```

## Production Enhancements (Beyond This Setup)

- [ ] **Pod Disruption Budgets (PDB):** Ensure availability during cluster upgrades
- [ ] **Network Policies:** Restrict inter-pod communication (defense in depth)
- [ ] **Secrets Management:** Integrate with Vault, AWS Secrets Manager, or Sealed Secrets
- [ ] **GitOps:** ArgoCD for automated deployments from Git
- [ ] **Service Mesh:** Istio for advanced traffic management, security, observability
- [ ] **Cost Optimization:** Horizontal pod autoscaling (HPA) based on CPU/custom metrics
- [ ] **Backup Strategy:** Automated snapshots of databases and PVs
- [ ] **Multi-region failover:** Cross-region replication and DNS failover

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod -n apps <pod-name>
kubectl logs -n apps <pod-name> --previous
```

### Service not reachable
```bash
kubectl exec -n apps deployment/<service> -- nslookup <service-name>
kubectl exec -n apps deployment/<service> -- curl http://<service-name>:8080/actuator/health
```

### Image pull errors
```bash
kubectl describe pod -n apps <pod-name>
# Check imagePullSecrets and registry credentials
```

### Database connection issues
```bash
kubectl exec -n infra statefulset/mysql-order -- mysql -u root -pmysql -e "SHOW DATABASES;"
```


