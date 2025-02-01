/** @format */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileValidator {
  constructor(
    private readonly allowedMimeTypes: string[],
    private readonly maxSize: number
  ) {}

  validate(file: Express.Multer.File): ValidationResult {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(
          ', '
        )}`,
      };
    }

    if (file.size > this.maxSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${this.maxSize / 1024 / 1024}MB`,
      };
    }

    return { isValid: true };
  }
}
