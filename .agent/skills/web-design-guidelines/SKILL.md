---
name: Web Design Guidelines
description: Review files for compliance with Vercel Web Interface Guidelines.
---

# Web Design Guidelines

This skill helps ensure UI components and pages adhere to Vercel's Web Interface Guidelines. Use this skill when reviewing UI code or implementing new designs.

## Usage

When asked to review a file for design compliance, or when implementing a new UI component, follow these steps:

1.  **Fetch Guidelines**: Retrieve the latest rules from the source.
    - Source URL: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
    - *Note*: Use `read_url_content` to get the latest rules dynamically if creating a new agent or if you need to refresh your context.

2.  **Review Target Files**: Read the content of the file(s) you are working on.

3.  **Apply Rules**: Check the code against the fetched guidelines. Look for:
    - Spacing and Layout (using design tokens correctly).
    - Typography (correct font sizes, weights).
    - Color usage (using standard palette).
    - Accessibility (ARIA attributes, contrast).
    - Component structure.

4.  **Output Findings**: Report any violations or suggested improvements, referencing the specific guideline rule.

## Core Principles
- **Clarity**: The interface should be self-explanatory.
- **Consistency**: Re-use existing patterns and components.
- **Feedback**: Provide clear feedback for user actions.
- **Efficiency**: Minimize the number of steps to achieve a goal.
