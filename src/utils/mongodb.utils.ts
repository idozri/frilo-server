import { Types } from 'mongoose';

export class MongoUtils {
  static toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  static toString(id: Types.ObjectId | string): string {
    return typeof id === 'string' ? id : id.toString();
  }

  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}
