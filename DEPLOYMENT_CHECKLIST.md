# Deployment Validation Checklist

## Environment
- All required env vars present
- validateEnv.js passes

## Build
- `npm install` succeeds
- `npm run build` (if applicable)

## Platform
- Render/Railway service configured
- Deploy webhook added to repo secrets

## Rollback
- Previous deploy retained
- Manual rollback documented
