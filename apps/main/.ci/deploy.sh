#!/usr/bin/env bash

# First run .ci/build.sh to build the image before deployment.

set -e
source .ci/config.sh

# Inject secrets
injectSecrets
rsync -azPI .env.prod ${SSH_USER}@${SSH_HOST}:${BASE_DIRECTORY}/${APP}/
echo "-- Successfully rsync-ed file."
scp -O ${SCP_PORT_OPT} .env.prod ${SSH_USER}@${SSH_HOST}:${BASE_DIRECTORY}/${APP}/.env

# Deploy updated docker-compose config
scp -O ${SCP_PORT_OPT} ../../.ci/docker-compose.yml ${SSH_USER}@${SSH_HOST}:${BASE_DIRECTORY}/${APP}

# Package and send docker image
docker save -o $(pwd)/${APP_SCOPE}.tar "${IMAGE_PATH}:latest"
scp -O ${SCP_PORT_OPT} $(pwd)/${APP_SCOPE}.tar ${SSH_USER}@${SSH_HOST}:${BASE_DIRECTORY}
rm -f $(pwd)/${APP_SCOPE}.tar

# Load and start docker container
ssh ${SSH_PORT_OPT} ${SSH_USER}@${SSH_HOST} "docker rm -f ${APP_SCOPE} || true"
ssh ${SSH_PORT_OPT} ${SSH_USER}@${SSH_HOST} "docker load -i ${BASE_DIRECTORY}/${APP_SCOPE}.tar"
ssh ${SSH_PORT_OPT} ${SSH_USER}@${SSH_HOST} "rm -f ${BASE_DIRECTORY}/${APP_SCOPE}.tar"
ssh ${SSH_PORT_OPT} ${SSH_USER}@${SSH_HOST} "cd ${BASE_DIRECTORY}/${APP} && docker-compose up --detach --build ${APP_SCOPE}"
