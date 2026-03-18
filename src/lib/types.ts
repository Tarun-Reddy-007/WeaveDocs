/**
 * Type definitions for WeaveDocs
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  filename: string;
  uploadedAt: Date;
  size: number;
  pages: number;
}

export interface FormState {
  error?: string;
  success?: boolean;
}

export type LayoutVariant = 'primary' | 'secondary' | 'minimal';
export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';
