# Masterplan: Us Mode

## App Overview and Objectives

Us Mode is a shared productivity app designed for couples who want to manage household responsibilities in a fun, cooperative way. It offers a lightweight, mobile-first interface where both partners can track tasks, earn points, and redeem shared rewards — turning everyday chores into a playful experience.

## Target Audience

* Couples looking to share and balance household responsibilities
* Partners who enjoy gamification in daily life
* Relationship-focused users who want light productivity tools with a warm, romantic design touch

## Core Features and Functionality

* **Landing Page** with a single call-to-action to enter the shared space
* **Shared Task Panel**: Add, view, and complete tasks with point assignments (+1, +5, +10)
* **Shared Rewards Panel**: Add, view, and redeem rewards with point costs
* **Realtime Sync** between both users (using Supabase)
* **User Auth**: Optional sign-up via Email/Password or Google OAuth
* **Invite System**: Send partner invites by email
* **No-auth mode**: Try-before-sign-up UX

## High-Level Technical Stack Recommendations

* **Frontend**: Vite + React + TypeScript
* **Styling/UI**: Tailwind CSS + shadcn/ui + Inter font
* **Backend & Database**: Supabase (PostgreSQL, Realtime, Auth)
* **Authentication**: Supabase Auth (Email/password, Google SSO)
* **Hosting**: Vercel or Netlify for frontend, Supabase backend

## Conceptual Data Model

* **Users**: `id`, `email`, `name`, `points`
* **Pairs**: `id`, `user_1_id`, `user_2_id`
* **Tasks**: `id`, `description`, `tag`, `points`, `completed_by_user_id`, `pair_id`, `created_at`, `completed_at`
* **Rewards**: `id`, `description`, `cost`, `claimed_by_user_id`, `pair_id`, `created_at`, `claimed_at`
* **Invites**: `id`, `email`, `pair_id`, `status`

## User Interface Design Principles

* Mobile-first, vertical split-screen layout
* Warm, gentle tones with romantic visual elements (e.g., hearts, soft animations)
* Minimalist but friendly UI: clean lines, generous spacing, intuitive forms
* Task and reward lists use scrollable panels with subtle animations

## Security Considerations

* Auth via Supabase (secure handling of credentials)
* Role validation (e.g., users can only modify items within their pair group)
* Realtime data syncing scoped per-pair
* Optional use without auth (temporary session storage)

## Development Phases or Milestones

1. **Prototype UI with Local State**
2. **Integrate Supabase backend (Realtime, Auth, DB)**
3. **Implement Task + Reward CRUD and Point System**
4. **Enable Google/Email Auth + Invite Flow**
5. **Polish Mobile UX + Add Animations and Styling**
6. **Launch MVP**

## Potential Challenges and Solutions

* **Realtime Sync Conflicts**: Leverage Supabase's built-in Realtime support with scoped channels per pair
* **Handling Offline Mode**: Cache updates locally and resync on reconnect (optional for V2)
* **No-auth Mode UX**: Use temporary local storage for try-before-sign-in

## Future Expansion Possibilities

* Roles for children or family group structures
* Task recurrence or scheduling
* Shared calendar integration
* Analytics or progress charts for gamification
* AI-based task suggestions or motivational nudges
