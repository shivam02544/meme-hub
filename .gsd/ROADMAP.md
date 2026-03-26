# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] User Auth (Register, Login, OTP)
- [ ] File Upload handling (Local FS)
- [ ] Meme creation (Text, Image, Video) mapping to Oracle DB
- [ ] Like and Comment systems
- [ ] Skeuomorphic UI Design and responsive layouts

## Phases

### Phase 1: Foundation & Skeuomorphic Design System (CSS/UI)
**Status**: ✅ Complete
**Objective**: Setup global CSS, styling variables for soft shadows/gradients, layout components (Navbar, Container), and apply responsiveness.
**Requirements**: REQ-09

### Phase 2: User Profiles & Advanced Auth (Frontend + Backend)
**Status**: ✅ Complete
**Objective**: Build out the user profile edit functionality, integrate and stabilize the existing Express OTP auth flow with the new UI.
**Requirements**: REQ-01, REQ-02

### Phase 3: Media Uploads & Meme Management
**Status**: ✅ Complete
**Objective**: Implement local filesystem upload endpoints in Node, frontend forms for image/video/text memes, and database persistence.
**Requirements**: REQ-03, REQ-04, REQ-05

### Phase 4: Interaction Features (Feeds, Likes, Comments)
**Status**: ✅ Complete
**Objective**: Develop the feed view, category filtering, flat commenting, and liking logic on both frontend and backend.
**Requirements**: REQ-06, REQ-07, REQ-08

### Phase 5: Polish, Testing, and Launch
**Status**: ⬜ Not Started
**Objective**: End-to-end testing across devices, finalize skeuomorphic refinements, fix bugs, and ensure constraints are met.
