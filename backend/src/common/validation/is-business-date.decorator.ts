import { registerDecorator, ValidationOptions } from 'class-validator';
import { isBusinessDate } from '../time/business-time';

export function IsBusinessDate(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string): void => {
    registerDecorator({
      name: 'isBusinessDate',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid date in YYYY-MM-DD format`,
        ...validationOptions,
      },
      validator: { validate: isBusinessDate },
    });
  };
}
