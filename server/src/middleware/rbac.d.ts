import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare const requireRole: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rbac.d.ts.map