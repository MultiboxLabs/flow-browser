#!/bin/bash
# scripts/lint-z-index.sh
# CI enforcement script for the layering system.
# Fails if prohibited raw z-index patterns are found outside of the
# canonical layers.ts / layers.css definitions.

ERRORS=0

# Paths to exclude from checks
EXCLUDE="layers.css\|layers.ts\|node_modules\|\.test\.\|\.spec\.\|__tests__\|\.md$\|/public/"

# Check for raw Tailwind z-index classes (but not our semantic ones or negative values)
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' --include='*.css' \
  -E '\bz-[0-9]+\b' src/ \
  | grep -v -E '\-z-[0-9]+' \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Raw Tailwind z-index classes found. Use z-elevated, z-modal, etc."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for arbitrary z-index values (z-[5] in onboarding is an allowed decorative exception)
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' --include='*.css' \
  -E 'z-\[.+\]' src/ \
  | grep -v 'z-\[5\]' \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Arbitrary z-index values found. Add a named layer to layers.ts."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for raw CSS z-index declarations
MATCHES=$(grep -rn --include='*.css' \
  -E 'z-index:\s*[0-9]+' src/ \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Raw CSS z-index found. Use var(--z-*) custom properties."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for inline JS zIndex with numeric literals
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' \
  -E 'zIndex:\s*[0-9]+' src/ \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Inline numeric zIndex found. Use UILayer.* constants."
  echo "$MATCHES"
  ERRORS=1
fi

exit $ERRORS
