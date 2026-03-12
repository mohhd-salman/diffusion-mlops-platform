pipeline {
    agent any
    environment {
        // Mock variables to simulate your real build
        DEPLOY_NAME = "debug-deploy-123"
        SVC_NAME    = "debug-svc-123"
        APP_LABEL   = "debug-app-123"
        IMAGE       = "us-central1-docker.pkg.dev/project/repo/image:debug"
        PIPELINE_REPO_URL = "${env.PIPELINE_REPO_URL}" 
    }
    stages {
        stage('Rapid YAML Debug') {
            steps {
                script {
                    sh """
                        echo "--- STEP 1: Cloning Manifests ---"
                        rm -rf platform-manifests
                        git clone --branch mlops_pipeline ${env.PIPELINE_REPO_URL} platform-manifests

                        echo "--- STEP 2: Pre-Render Check ---"
                        echo "Looking for GPU Limit placeholder in raw file:"
                        grep "nvidia.com/gpu" platform-manifests/k8s/deployment.yaml || echo "NOT FOUND IN RAW FILE"

                        echo "--- STEP 3: Rendering ---"
                        sed -i "s|\\\${MODEL_DEPLOYMENT_NAME}|${DEPLOY_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_SERVICE_NAME}|${SVC_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_APP_LABEL}|${APP_LABEL}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${PLACEHOLDER_IMAGE}|${IMAGE}|g" platform-manifests/k8s/deployment.yaml
                        
                        # THE FORCE INSERT (Temporary fix if placeholder is missing)
                        # Uncomment the line below if the grep in Step 4 is still empty
                        # sed -i '/limits:/a \                nvidia.com/gpu: 1' platform-manifests/k8s/deployment.yaml

                        echo "--- STEP 4: FINAL VERIFICATION ---"
                        echo "Full Resources Block after Rendering:"
                        grep -A 10 "resources:" platform-manifests/k8s/deployment.yaml
                        
                        echo "--- STEP 5: Taint/Toleration Check ---"
                        grep -A 5 "tolerations:" platform-manifests/k8s/deployment.yaml
                    """
                }
            }
        }
    }
}