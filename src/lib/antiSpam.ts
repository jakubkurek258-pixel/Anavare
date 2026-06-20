/**
 * Anti-Spam protection and client-side Rate Limiting Service
 */

interface UploadMetadata {
  name: string;
  size: number;
}

interface UserSpamTracker {
  lastActionTime: number; // For posts, comments, course creation
  lastUploadTime: number; // For any file uploads (images/videos)
  lastUploadedFile?: UploadMetadata;
}

// In-memory rate limiting map keyed by userId
const userTrackers = new Map<string, UserSpamTracker>();

const COOLDOWN_ACTION_SEC = 8; // 8 seconds between actions
const COOLDOWN_UPLOAD_SEC = 10; // 10 seconds between uploads
const REPEATED_UPLOAD_WINDOW_SEC = 30; // 30 seconds duplicate file upload ban

export const antiSpam = {
  /**
   * Checks if the user is spamming actions.
   * Throws an error with a warm warning if they are in a cooldown window.
   */
  checkAction(userId: string): void {
    if (!userId) return;
    const now = Date.now();
    const tracker = userTrackers.get(userId);

    if (tracker) {
      const elapsed = now - tracker.lastActionTime;
      const cooldownMs = COOLDOWN_ACTION_SEC * 1000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new Error(`You are doing this too fast. Please wait a few seconds (${remaining}s remaining).`);
      }
    }
  },

  /**
   * Registers a successful action for rate-limiting.
   */
  registerAction(userId: string): void {
    if (!userId) return;
    const tracker = userTrackers.get(userId) || { lastActionTime: 0, lastUploadTime: 0 };
    tracker.lastActionTime = Date.now();
    userTrackers.set(userId, tracker);
  },

  /**
   * Checks if the user is spamming uploads or uploading duplicates.
   * Throws an error with a warm warning if they should be blocked.
   */
  checkUpload(userId: string, file: File): void {
    if (!userId) return;
    const now = Date.now();
    const tracker = userTrackers.get(userId);

    if (tracker) {
      // 1. Check duplicate file within the duplicate window
      if (tracker.lastUploadedFile) {
        const duplicateElapsed = now - tracker.lastUploadTime;
        const duplicateWindowMs = REPEATED_UPLOAD_WINDOW_SEC * 1000;
        
        if (
          tracker.lastUploadedFile.name === file.name &&
          tracker.lastUploadedFile.size === file.size &&
          duplicateElapsed < duplicateWindowMs
        ) {
          throw new Error('You have already uploaded this file recently. Please select a different file or wait a moment.');
        }
      }

      // 2. Check general uploads cooldown
      const elapsed = now - tracker.lastUploadTime;
      const cooldownMs = COOLDOWN_UPLOAD_SEC * 1000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new Error(`You are uploading files too fast! Please wait ${remaining} seconds.`);
      }
    }
  },

  /**
   * Registers a successful file upload.
   */
  registerUpload(userId: string, file: File): void {
    if (!userId) return;
    const tracker = userTrackers.get(userId) || { lastActionTime: 0, lastUploadTime: 0 };
    tracker.lastUploadTime = Date.now();
    tracker.lastUploadedFile = {
      name: file.name,
      size: file.size
    };
    userTrackers.set(userId, tracker);
  },

  /**
   * Resets rate-limiting logs for a specific user (on logout or login)
   */
  resetForUser(userId: string): void {
    if (userId) {
      userTrackers.delete(userId);
    }
  },

  /**
   * Clears all tracking data
   */
  resetAll(): void {
    userTrackers.clear();
  }
};
