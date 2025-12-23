#!/bin/bash
# Deploy email templates to Supabase production
# Usage: SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=<ref> ./scripts/deploy-email-templates.sh

set -e

if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Error: Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF environment variables"
  echo "Get your access token from: https://supabase.com/dashboard/account/tokens"
  echo "Get your project ref from your project URL: https://supabase.com/dashboard/project/<ref>"
  exit 1
fi

API_URL="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth"

# Read template files
CONFIRM_TEMPLATE=$(cat supabase/templates/confirm.html)
RECOVERY_TEMPLATE=$(cat supabase/templates/recovery.html)
INVITE_TEMPLATE=$(cat supabase/templates/invite.html)
MAGIC_LINK_TEMPLATE=$(cat supabase/templates/magic_link.html)
EMAIL_CHANGE_TEMPLATE=$(cat supabase/templates/email_change.html)

echo "Deploying email templates to Supabase..."

curl -s -X PATCH "$API_URL" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data @- << EOF
{
  "mailer_templates_confirmation_content": $(echo "$CONFIRM_TEMPLATE" | jq -Rs .),
  "mailer_templates_confirmation_subject": "Confirm Your Email - Sakiyomi",
  "mailer_templates_recovery_content": $(echo "$RECOVERY_TEMPLATE" | jq -Rs .),
  "mailer_templates_recovery_subject": "Reset Your Password - Sakiyomi",
  "mailer_templates_invite_content": $(echo "$INVITE_TEMPLATE" | jq -Rs .),
  "mailer_templates_invite_subject": "You've Been Invited - Sakiyomi",
  "mailer_templates_magic_link_content": $(echo "$MAGIC_LINK_TEMPLATE" | jq -Rs .),
  "mailer_templates_magic_link_subject": "Sign In to Sakiyomi",
  "mailer_templates_email_change_content": $(echo "$EMAIL_CHANGE_TEMPLATE" | jq -Rs .),
  "mailer_templates_email_change_subject": "Confirm Email Change - Sakiyomi"
}
EOF

echo ""
echo "Done! Email templates deployed to production."
