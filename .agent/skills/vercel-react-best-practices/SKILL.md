---
name: Vercel React Best Practices
description: A comprehensive guide and checklist for optimizing React applications on Vercel, focusing on performance, bundle size, and rendering.
---

# Vercel React Best Practices

This skill provides a set of rules and best practices for developing high-performance React applications deployed on Vercel. Use this skill when optimizing code, performing code reviews, or setting up new features to ensure scalability and speed.

## when to use
- During **Code Reviews** to identify performance bottlenecks.
- When **Optimizing** an existing application (e.g., improving Core Web Vitals).
- When **Architecting** new features to avoid common pitfalls (waterfalls, large bundles).

## Critical Rules (Must Fix)

### 1. Eliminating Waterfalls
Waterfalls occur when data fetching or dependent operations run sequentially instead of in parallel.
- **async-parallel**: Use `Promise.all()` for independent asynchronous operations. 
  - *Bad*: `const user = await getUser(); const posts = await getPosts();`
  - *Good*: `const [user, posts] = await Promise.all([getUser(), getPosts()]);`
- **async-defer-await**: Move `await` statements as late as possible, or into the specific branches where the data is needed.
- **async-dependencies**: If data B depends on data A, fetch A, then start fetching B immediately while processing other things if possible.
- **async-suspense-boundaries**: Use React Suspense to stream content and avoid blocking the entire page render.

### 2. Bundle Size Optimization
Reduce the amount of JavaScript sent to the client to improve First Contentful Paint (FCP) and Time to Interactive (TTI).
- **bundle-barrel-imports**: Avoid importing from "barrel" files (index.ts that re-exports everything). Import directly from the specific file.
  - *Bad*: `import { Button } from '@/components';` (if @/components/index.ts exports 100 components)
  - *Good*: `import { Button } from '@/components/Button';`
- **bundle-dynamic-imports**: Use `next/dynamic` for heavy components (e.g., Rich Text Editors, Charts, Maps) that are not needed immediately or are below the fold.
  - *Example*: `const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });`
- **bundle-defer-third-party**: Load heavy third-party scripts (analytics, chat widgets) after hydration or on interaction using `next/script` strategies (`lazyOnload`, `onLoad`).

## High Priority Rules

### 3. Server-Side Performance
Optimize Server-Side Rendering (SSR) and Server Actions.
- **server-cache-react**: Use `React.cache()` to deduplicate data fetching requests within a single render pass.
- **server-auth-actions**: Ensure Server Actions are properly authenticated.
- **server-serialization**: Minimize the data passed from Server Components to Client Components. Only pass what is strictly needed to avoid serialization overhead.
- **server-parallel-fetching**: Fetch data in parallel in parent components where possible.

## Medium Priority Rules

### 4. Client-Side Data Fetching
- **client-swr-dedup**: Use libraries like SWR or React Query for automatic request deduplication and caching on the client.
- **client-event-listeners**: Clean up event listeners in `useEffect` (return a cleanup function).

### 5. Re-render Optimization
- **rerender-memo**: Use `React.memo` for expensive components that re-render often with the same props.
- **rerender-dependencies**: Ensure `useEffect` and `useCallback` dependency arrays are accurate. Avoid objects/arrays in dependencies unless memoized.
- **rerender-lazy-state-init**: For expensive initial state calculations, pass a function to `useState`: `useState(() => expensiveCalculation())`.

## Low Priority / Advanced

- **js-early-exit**: Return early from functions to avoid unnecessary processing.
- **rendering-content-visibility**: Use CSS `content-visibility: auto` for long lists to skip rendering off-screen content.
