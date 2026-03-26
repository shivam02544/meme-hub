# Architectural Decision Log

1. **Storage Mechanism**: Chosen local server filesystem for image and video uploads to maintain simplicity as opposed to integrating AWS S3/Cloudinary. Database maintains only file paths.
2. **Comment Structure**: Flat structure selected over threaded replies to minimize DB complexity and UI clutter.
3. **UI Aesthetic**: Skeuomorphic design (soft gradients, inset shadows) explicitly scoped to avoid excessive 3D overhead while satisfying aesthetic requirements.
