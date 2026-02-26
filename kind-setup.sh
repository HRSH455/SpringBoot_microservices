#!/bin/bash
# kind-setup.sh - Create kind cluster with local registry for dev environment

set -e

CLUSTER_NAME="microservices-dev"
KIND_CONFIG_FILE="kind-config.yaml"
REGISTRY_NAME="microservices-registry"
REGISTRY_PORT=5000

echo "=== Setting up kind cluster with local registry ==="

# Create kind config with local registry
cat > "$KIND_CONFIG_FILE" << 'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: microservices-dev
nodes:
  - role: control-plane
    ports:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
containerdConfigPatches:
  - |-
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
      endpoint = ["http://microservices-registry:5000"]
EOF

# Check if cluster already exists
if kind get clusters | grep -q "^$CLUSTER_NAME$"; then
    echo "Cluster $CLUSTER_NAME already exists. Deleting it first..."
    kind delete cluster --name "$CLUSTER_NAME"
fi

# Create the cluster
echo "Creating kind cluster: $CLUSTER_NAME"
kind create cluster --config "$KIND_CONFIG_FILE"

# Create local registry if not exists
if ! docker ps --filter "name=$REGISTRY_NAME" --format '{{.Names}}' | grep -q "^$REGISTRY_NAME$"; then
    echo "Creating local registry: $REGISTRY_NAME on port $REGISTRY_PORT"
    docker run -d \
        --name "$REGISTRY_NAME" \
        --restart unless-stopped \
        -p "$REGISTRY_PORT:5000" \
        registry:2
    sleep 2
fi

# Connect registry to kind network
docker network connect kind "$REGISTRY_NAME" 2>/dev/null || true

# Create config map for registry endpoint
echo "Configuring registry endpoint..."
kubectl create configmap local-registry-hosting \
    --from-literal=localRegistryHosting.v1="|
kind: LocalRegistryHosting
apiVersion: v1
host: localhost:$REGISTRY_PORT
help: https://kind.sigs.k8s.io/docs/user/local-registry/" \
    --namespace kube-public || true

# Install nginx ingress controller
echo "Installing nginx ingress controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller
echo "Waiting for nginx ingress controller..."
kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s || true

# Add local hostnames to /etc/hosts (requires manual intervention or sudo)
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Cluster Name: $CLUSTER_NAME"
echo "Registry: localhost:$REGISTRY_PORT"
echo ""
echo "Next steps:"
echo "1. Add to /etc/hosts (may require sudo):"
echo "   127.0.0.1 api.localdev.me"
echo "   127.0.0.1 keycloak.localdev.me"
echo "   127.0.0.1 frontend.localdev.me"
echo "   127.0.0.1 prometheus.localdev.me"
echo "   127.0.0.1 grafana.localdev.me"
echo ""
echo "2. Deploy the project:"
echo "   kubectl apply -k k8s/overlays/dev"
echo ""
echo "3. View logs:"
echo "   kubectl logs -n apps -l app=product-service -f"
echo ""
