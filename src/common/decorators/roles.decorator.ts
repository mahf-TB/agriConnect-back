import { SetMetadata } from '@nestjs/common';
import { Role } from 'generated/enums';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
