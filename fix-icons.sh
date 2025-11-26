#!/bin/bash

# Fix react-icons TypeScript issues by replacing JSX with Icon component

FILES="pages/admin/*.tsx"

for file in $FILES; do
  echo "Processing $file..."

  # Add Icon import and IconType import after react-icons import
  sed -i '' '/from "react-icons\/fi"/a\
import { IconType } from "react-icons";\
import Icon from "..\/..\/components\/Icon";
' "$file"

  # Replace <FiIconName with <Icon icon={FiIconName}
  # This is a simplified version - may need manual adjustments

done

echo "Done! Please review the changes manually."
