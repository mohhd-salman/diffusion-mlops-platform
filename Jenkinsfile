pipeline {
    agent any

    parameters {
        string(name: 'REPO_URL', defaultValue: '', description: 'GitHub Repository URL')
        string(name: 'BRANCH_NAME', defaultValue: 'main', description: 'GitHub Branch Name')
        string(name: 'DEPLOYMENT_ID', defaultValue: '', description: 'Unique Deployment ID')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'User GitHub token')
    }

    environment {
        DEPLOY_NAME = "debug-deploy-${params.DEPLOYMENT_ID}".toLowerCase()
        SVC_NAME    = "debug-svc-${params.DEPLOYMENT_ID}".toLowerCase()
        APP_LABEL   = "debug-app-${params.DEPLOYMENT_ID}".toLowerCase()
        IMAGE       = "us-central1-docker.pkg.dev/project/repo/image:debug"
        PIPELINE_REPO_URL = "${env.PIPELINE_REPO_URL}" 
    }

    stages {
        stage('Rapid YAML Test') {
            steps {
                script {
                    sh """
                        echo "--- STEP 1: Cloning Manifests ---"
                        rm -rf platform-manifests
                        git clone --branch mlops_pipeline ${env.PIPELINE_REPO_URL} platform-manifests

                        echo "--- STEP 2: Rendering Standard Placeholders ---"
                        # Rendering using the same logic as your main pipeline
                        sed -i "s|\\\${MODEL_DEPLOYMENT_NAME}|${DEPLOY_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_SERVICE_NAME}|${SVC_NAME}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${MODEL_APP_LABEL}|${APP_LABEL}|g" platform-manifests/k8s/deployment.yaml
                        sed -i "s|\\\${PLACEHOLDER_IMAGE}|${IMAGE}|g" platform-manifests/k8s/deployment.yaml

                        echo "--- STEP 3: Verification Checks ---"
                        echo ">>> Checking for GPU Limit line:"
                        grep "nvidia.com/gpu" platform-manifests/k8s/deployment.yaml || echo "ERROR: GPU Limit not found!"

                        echo "--- STEP 4: FULL RENDERED YAML PREVIEW ---"
                        echo "----------------------------------------------------"
                        cat platform-manifests/k8s/deployment.yaml
                        echo "----------------------------------------------------"
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo "Debug run finished. Check logs for YAML output."
        }
    }
}