#!/bin/sh
while :; do
    mkdir -p /tmp/gcloud
    echo "$(date): Generating token"
    vault login -field=token -method=gcp \
        role="$GCP_VAULT_IAM_ROLE" \
        service_account="$GCP_SA_EMAIL" \
        project="$GCP_PROJECT" \
        jwt_exp="890s" \
        credentials=@"$GCP_SA_KEY_FILE_PATH" >| /tmp/gcloud/v-token.tmp

    # Should be atomic (no broken file handlers):
    (
        flock -x 200
        mv /tmp/gcloud/v-token.tmp /opt/gcloud/v-token
    ) 200>/tmp/gcloud/v-token.lock

    sleep 800
done
