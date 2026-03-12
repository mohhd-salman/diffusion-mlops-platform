pipeline {
    agent any
    environment {
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
                        git clone --branch mlops_pipeline ${PIPELINE_REPO_URL} platform-manifests

                        echo "--- STEP 2: Rendering Standard Placeholders ---"
                        # Note the triple backslash: one for Groovy, two for Shell
                        sed -i "s|\\\${MODEL_DEPLOYMENT_NAME}|${DEPLOY_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_SERVICE_NAME}|${SVC_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_APP_LABEL}|${APP_LABEL}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${PLACEHOLDER_IMAGE}|${IMAGE}|g" platform-manifests/k8s/deployment.yaml

                        echo "--- STEP 3: Forcing GPU Limit Insert ---"
                        # This uses a safer replacement syntax to avoid the 'a' command's backslash issues
                        # It looks for 'limits:' and replaces it with 'limits:' plus the GPU line
                        sed -i 's/limits:/limits:\\n                nvidia.com\\/gpu: 1/' platform-manifests/k8s/deployment.yaml

                        echo "--- STEP 4: FINAL VERIFICATION ---"
                        echo ">>> Checking Resources Block:"
                        grep -A 10 "resources:" platform-manifests/k8s/deployment.yaml
                        
                        echo ">>> Checking NodeSelector & Tolerations:"
                        grep -E "nodeSelector|tolerations" -A 5 platform-manifests/k8s/deployment.yaml
                        
                        echo "--- FULL RENDERED FILE PREVIEW ---"
                        cat platform-manifests/k8s/deployment.yaml
                    """
                }
            }
        }
    }
}