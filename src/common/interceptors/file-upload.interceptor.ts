/** @format */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnsupportedMediaTypeException,
  mixin,
  Type,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileValidator } from '../validators/file.validator';

export function FileUploadInterceptor(
  allowedMimeTypes: string[],
  maxSize: number = 5 * 1024 * 1024
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private validator: FileValidator;

    constructor() {
      this.validator = new FileValidator(allowedMimeTypes, maxSize);
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const file = request.file;

      if (file) {
        const validationResult = this.validator.validate(file);
        if (!validationResult.isValid) {
          throw new UnsupportedMediaTypeException(validationResult.error);
        }
      }

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
