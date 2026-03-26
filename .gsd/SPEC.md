# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A modern, simple, and clean meme collection web application featuring a skeuomorphic UI design (soft shadows, subtle gradients, and realistic buttons). It provides a responsive, intuitive experience across all devices without unnecessary complexity.

## Goals
1. Provide a robust registration and login system.
2. Allow users to manage profiles and upload text, image, and video memes.
3. Enable basic user interaction through likes and flat comments.
4. Support categorical browsing using predefined, admin-managed categories.

## Non-Goals (Out of Scope)
- Cloud storage integration (media is stored locally).
- Threaded/nested comment replies.
- User-created custom categories.
- Heavy 3D or extremely complex UI animations.

## Users
Meme enthusiasts looking for a clean, straightforward platform to share, categorize, and interact with various formats of memes.

## Constraints
- **Technical**: React frontend, Node.js/Express backend, Oracle database.
- **Infrastructure**: Local server filesystem for media storage.
- **Design**: Skeuomorphic but lightweight and responsive.

## Success Criteria
- [ ] Users can successfully register, log in, and edit profiles.
- [ ] Users can upload images, videos, and text-based memes.
- [ ] Users can browse memes by predefined categories.
- [ ] Users can like and comment on memes without nested replies.
- [ ] UI renders responsively across mobile, tablet, and desktop with a skeuomorphic aesthetic.
