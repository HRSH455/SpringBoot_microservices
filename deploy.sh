#!/bin/bash
# deploy.sh - Quick deployment script for local dev environment

set -e

REGISTRY="${REGISTRY:-localhost:5000}"
NAMESPACE_DEV="apps"
KUSTOMIZE_OVERLAY="k8s/overlays/dev"

echo "=== Microservices Deployment Script ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required"; exit 1; }
command -v kustomize >/dev/null 2>&1 || { echo "Kustomize is required"; exit 1; }

# Build images
echo ""
echo "Building Docker images..."

services=("api-gateway" "product-service" "order-service" "inventory-service" "notification-service")

for service in "${services[@]}"; do
    echo "Building $service..."
    docker build \
        -f Dockerfile.jvm \
        -t "$REGISTRY/$service:latest" \
        ./$service/
done

echo "Building frontend..."
docker build \
    -f microservices-shop-frontend-master/Dockerfile \
    -t "$REGISTRY/frontend:latest" \
    ./microservices-shop-frontend-master/

# Push images (for local registry, optional as images are already built locally)
echo ""
echo "Pushing images to registry: $REGISTRY"

for service in "${services[@]}"; do
    docker push "$REGISTRY/$service:latest"
done

docker push "$REGISTRY/frontend:latest"

# Deploy to Kubernetes
echo ""
echo "Deploying to Kubernetes..."

# Generate manifests
echo "Generating Kustomize manifests..."
kustomize build "$KUSTOMIZE_OVERLAY" > generated-manifests.yaml

# Apply manifests
echo "Applying manifests..."
kubectl apply -f generated-manifests.yaml

# Wait for deployments
echo ""
echo "Waiting for deployments to be ready..."

# Wait for infra services (databases, kafka, keycloak)
echo "Waiting for infrastructure services..."
kubectl wait --for=condition=ready pod \
    -l app=mysql-order \
    -n infra \
    --timeout=120s || true

kubectl wait --for=condition=ready pod \
    -l app=kafka \
    -n infra \
    --timeout=120s || true

kubectl wait --for=condition=ready pod \
    -l app=keycloak \
    -n infra \
    --timeout=180s || true

# Wait for app services
echo "Waiting for microservices..."
for service in "${services[@]}"; do
    echo "Waiting for $service..."
    kubectl wait --for=condition=ready pod \
        -l app=$service \
        -n $NAMESPACE_DEV \
        --timeout=120s || true
done

kubectl wait --for=condition=ready pod \
    -l app=frontend \
    -n $NAMESPACE_DEV \
    --timeout=120s || true

# Display deployment status
echo ""
echo "=== Deployment Status ==="
echo ""

echo "Infrastructure Services:"
kubectl get pods -n infra

echo ""
echo "Application Services:"
kubectl get pods -n $NAMESPACE_DEV

echo ""
echo "Observability Stack:"
kubectl get pods -n observability

echo ""
echo "Services (ClusterIP):"
kubectl get svc -n $NAMESPACE_DEV

echo ""
echo "Ingress:"
kubectl get ingress -n $NAMESPACE_DEV

echo ""
echo "=== Access Points ==="
echo ""
echo "API Gateway:  http://api.localdev.me"
echo "Frontend:     http://frontend.localdev.me"
echo "Keycloak:     http://keycloak.localdev.me (admin/admin)"
echo "Grafana:      http://grafana.localdev.me (admin/admin)"
echo "Prometheus:   http://prometheus.localdev.me"
echo ""

echo "=== View Logs ==="
echo ""
echo "kubectl logs -n $NAMESPACE_DEV -l app=api-gateway -f"
echo "kubectl logs -n $NAMESPACE_DEV -l app=order-service -f"
echo "kubectl logs -n infra -l app=keycloak -f"
echo ""

echo "=== Smoke Tests ==="
echo ""

# Test API Gateway health
echo "Testing API Gateway health..."
kubectl run --rm -i --restart=Never --image=curlimages/curl \
    curl-test -- curl -s http://api-gateway-service.apps.svc.cluster.local:9000/actuator/health | head -20

echo ""
echo "Deployment complete!"
