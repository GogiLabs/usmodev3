# Implementation Plan: Us Mode

## Phase 1: UI Prototype (Local State)

* Set up Vite + React + Tailwind project 
* Implement static versions of:

  * Landing Page
  * Split Main Screen with Task & Reward panels
  * Add/Complete task interaction (local state only)
  * Add/Claim rewards (local state only)

## Phase 2: Backend Integration

* Set up Supabase project
* Create DB tables: users, pairs, tasks, rewards, invites
* Integrate Supabase client into frontend
* Implement Realtime listeners for tasks and rewards scoped to pair ID

## Phase 3: Authentication + Invite Flow

* Enable Google and Email/Password Auth in Supabase
* Add Sign-Up and Sign-In modal
* Implement Invite Partner modal and logic (email-based)
* On successful invite: link both users to a shared `pair_id`

## Phase 4: Task & Reward Logic (Live)

* Connect forms to Supabase

  * Create task with metadata (points, tag, etc.)
  * Mark task as completed by user
  * Update user points
  * Add and claim rewards
* Display list views with Supabase Realtime updates

## Phase 5: UI Polish + Mobile Responsiveness

* Apply full color palette and Inter font
* Optimize layout for mobile-first experience
* Add subtle animations and decorative elements (e.g., hearts, fades)

## Phase 6: MVP Launch

* Final testing (2-user sync, point accuracy, sign-up flow)
* Deploy on Vercel or Netlify
* Monitor Supabase usage and logs

## Optional Post-MVP Enhancements

* Offline support (localStorage + re-sync)
* Task scheduling / reminders
* Family roles (parents/kids)
* Custom tags and filters
* AI-based task suggestions (long-term)

## Suggested Team Setup

* 1 Frontend Engineer (React/TS/Tailwind)
* 1 Backend Engineer or Fullstack with Supabase experience
* 1 Designer (for polish and animation flair)

## MVP Timeline (6–8 Weeks Estimate)

* Week 1–2: UI Prototyping
* Week 3–4: Backend Integration + Auth
* Week 5: Feature Completion (Task/Reward Logic)
* Week 6: Polish, Test, Deploy
