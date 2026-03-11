def BUILD_LOG_MESSAGE = 'Pipeline initialized.'

pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
    }

    parameters {
        string(name: 'REPO_URL', defaultValue: '', description: 'GitHub Repository URL')
        string(name: 'BRANCH_NAME', defaultValue: 'main', description: 'GitHub Branch Name')
        string(name: 'DEPLOYMENT_ID', defaultValue: '', description: 'Unique Deployment ID')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'User GitHub token (temporary)')
    }

    environment {
        GCP_PROJECT = "${env.GCP_PROJECT}"
        GKE_CLUSTER = "${env.GKE_CLUSTER}"
        GKE_LOCATION = "${env.GKE_LOCATION}"
        GAR_HOST = "${env.GAR_HOST}"
        GAR_REPO = "${env.GAR_REPO}"
        
        PIPELINE_REPO_URL = "${env.PIPELINE_REPO_URL}"
        
        REPO_NAME = sh(script: """echo "${params.REPO_URL}" | sed 's/\\.git\$//' | xargs basename""", returnStdout: true).trim()
        DOCKER_IMAGE_LOCAL = "${REPO_NAME}:${params.BRANCH_NAME}"
        IMAGE_TAG = "${params.DEPLOYMENT_ID}"
        FINAL_IMAGE_URL = "${GAR_HOST}/${GCP_PROJECT}/${GAR_REPO}/${REPO_NAME}:${IMAGE_TAG}"

        DEPLOY_NAME = "deploy-${params.DEPLOYMENT_ID}".toLowerCase()
        SVC_NAME = "svc-${params.DEPLOYMENT_ID}".toLowerCase()
        APP_LABEL = "app-${params.DEPLOYMENT_ID}".toLowerCase()
        IMAGE = "${FINAL_IMAGE_URL}"
    }

    stages {
        stage('Validate Inputs') {
            steps {
                script {
                    if (!params.REPO_URL?.trim()) error("REPO_URL is required")
                    if (!params.DEPLOYMENT_ID?.trim()) error("DEPLOYMENT_ID is required")
                    BUILD_LOG_MESSAGE = 'Parameters validated.'
                }
            }
        }

        stage('Clone User Repo') {
            steps {
                script {
                    try {
                        sh """
                            rm -rf ${REPO_NAME}
                            git clone https://${params.GITHUB_TOKEN}@${params.REPO_URL.replace('https://', '')} ${REPO_NAME}
                            cd ${REPO_NAME}
                            git checkout ${params.BRANCH_NAME}
                        """
                        BUILD_LOG_MESSAGE = 'Repo cloned.'
                    } catch (e) {
                        BUILD_LOG_MESSAGE = "Clone failed: ${e.getMessage()}"
                        throw e
                    }
                }
            }
        }

        stage('Check Dockerfile') {
            steps {
                dir("${REPO_NAME}") {
                    script {
                        if (!fileExists('Dockerfile')) {
                            BUILD_LOG_MESSAGE = "No Dockerfile found."
                            error(BUILD_LOG_MESSAGE)
                        }
                        BUILD_LOG_MESSAGE = "Dockerfile found."
                    }
                }
            }
        }

        stage('Build Image') {
            steps {
                dir("${REPO_NAME}") {
                    script {
                        sh "docker build -t ${DOCKER_IMAGE_LOCAL} ."
                        BUILD_LOG_MESSAGE = "Docker image built."
                    }
                }
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY_FILE')]) {
                        sh """
                            gcloud auth activate-service-account --key-file="$GCP_KEY_FILE"
                            gcloud config set project ${GCP_PROJECT}

                            gcloud auth configure-docker ${GAR_HOST} -q

                            docker tag ${DOCKER_IMAGE_LOCAL} ${FINAL_IMAGE_URL}
                            docker push ${FINAL_IMAGE_URL}
                        """
                        BUILD_LOG_MESSAGE = "Pushed image: ${FINAL_IMAGE_URL}"
                    }
                }
            }
        }

        stage('Prepare GPU Drivers') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY_FILE')]) {
                        sh """
                            echo "--- STEP: Authenticating with GCP ---"
                            gcloud auth activate-service-account --key-file="$GCP_KEY_FILE"
                            gcloud container clusters get-credentials ${GKE_CLUSTER} --zone ${GKE_LOCATION}
                            
                            echo "--- STEP: Checking/Applying NVIDIA Drivers ---"
                            kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/container-engine-accelerators/master/nvidia-driver-installer/cos/daemonset-preloaded.yaml
                            kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.17.1/deployments/static/nvidia-device-plugin.yml
                            
                            echo "--- STEP: Verifying GPU Node Resources ---"
                            sleep 10 
                            kubectl get nodes -l cloud.google.com/gke-nodepool=gpu-pool -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[-1].type,GPU_ALLOCATABLE:.status.allocatable.'nvidia\\.com/gpu'
                        """
                        BUILD_LOG_MESSAGE = "GPU Infrastructure verified."
                    }
                }
            }
        }

        stage('Apply K8s Resources') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY_FILE')]) {
                        try {
                            sh """
                                echo "--- STEP: Cloning Platform Manifests ---"
                                rm -rf platform-manifests
                                git clone --branch mlops_pipeline ${env.PIPELINE_REPO_URL} platform-manifests

                                echo "--- STEP: Rendering Deployment Manifest ---"
                                sed -e "s|\\\${MODEL_DEPLOYMENT_NAME}|${DEPLOY_NAME}|g" \
                                    -e "s|\\\${MODEL_SERVICE_NAME}|${SVC_NAME}|g" \
                                    -e "s|\\\${MODEL_APP_LABEL}|${APP_LABEL}|g" \
                                    -e "s|\\\${PLACEHOLDER_IMAGE}|${IMAGE}|g" \
                                    platform-manifests/k8s/deployment.yaml > /tmp/deployment.rendered.yaml

                                sed -e "s|\\\${MODEL_SERVICE_NAME}|${SVC_NAME}|g" \
                                    -e "s|\\\${MODEL_APP_LABEL}|${APP_LABEL}|g" \
                                    platform-manifests/k8s/service.yaml > /tmp/service.rendered.yaml

                                echo "--- STEP: Applying Resources to GKE ---"
                                kubectl apply -f /tmp/deployment.rendered.yaml
                                kubectl apply -f /tmp/service.rendered.yaml

                                echo "--- STEP: Waiting for Rollout (Up to 15 mins) ---"
                                kubectl rollout status deploy/${DEPLOY_NAME} --timeout=900s

                                echo "--- STEP: FETECHING APPLICATION LOGS ---"
                                echo "Displaying the last 50 lines of container logs:"
                                kubectl logs --tail=50 -l app=${APP_LABEL}
                            """
                            BUILD_LOG_MESSAGE = "Deployment successful. Model is running on GPU."
                        } catch (e) {
                            echo "!!! DEPLOYMENT FAILED !!!"
                            echo "Fetching Pod Status and Events for debugging:"
                            sh """
                                kubectl get pods -l app=${APP_LABEL}
                                kubectl describe pod -l app=${APP_LABEL} | grep -A 20 Events
                            """
                            BUILD_LOG_MESSAGE = "Kubernetes deployment failed: ${e.getMessage()}"
                            throw e
                        }
                    }
                }
            }
        }

        stage('Fetch Service Endpoint') {
            steps {
                script {
                    def ip = sh(
                        script: "kubectl get svc ${SVC_NAME} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'",
                        returnStdout: true
                    ).trim()

                    if (!ip) {
                        ip = sh(
                            script: "kubectl get svc ${SVC_NAME} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'",
                            returnStdout: true
                        ).trim()
                    }

                    if (!ip) {
                        BUILD_LOG_MESSAGE = "Service external endpoint not assigned yet. Waiting..."
                        currentBuild.result = 'UNSTABLE'  // Mark build as unstable if endpoint isn't assigned yet
                    } else {
                        env.DEPLOYED_ENDPOINT = "http://${ip}"
                        BUILD_LOG_MESSAGE = "Service reachable at: ${env.DEPLOYED_ENDPOINT}"
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                def payload = [
                    deployment_id: params.DEPLOYMENT_ID,
                    status: 'success',
                    endpoint_url: env.DEPLOYED_ENDPOINT,
                    build_number: env.BUILD_NUMBER,
                    build_log: BUILD_LOG_MESSAGE,
                    jenkins_job_name: env.JOB_NAME
                ]

                httpRequest(
                    url: "${env.BACKEND_URL}/deployments/jenkins/callback",
                    httpMode: 'POST',
                    contentType: 'APPLICATION_JSON',
                    requestBody: groovy.json.JsonOutput.toJson(payload)
                )
            }
        }

        failure {
            script {
                def payload = [
                    deployment_id: params.DEPLOYMENT_ID,
                    status: 'failed',
                    endpoint_url: null,
                    build_number: env.BUILD_NUMBER,
                    build_log: BUILD_LOG_MESSAGE,
                    jenkins_job_name: env.JOB_NAME
                ]

                httpRequest(
                    url: "${env.BACKEND_URL}/deployments/jenkins/callback",
                    httpMode: 'POST',
                    contentType: 'APPLICATION_JSON',
                    requestBody: groovy.json.JsonOutput.toJson(payload)
                )
            }
        }

        always {
            script {
                sh "docker system prune -a -f || true"
            }
        }
    }
}