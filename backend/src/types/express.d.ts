
// src/types/express.d.ts

// Define the structure of your User payload in the JWT
export interface JwtUserPayload { // Added export, though for augmentation it's not strictly needed for the module block below
  id: string;
  email: string;
  // storeId?: string; // Add if you include storeId in JWT
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUserPayload;
  }
}