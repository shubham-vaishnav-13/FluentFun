import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/async.js';

export const verifyAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Admin access required");
    }
    
    if (!req.user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }
    
    next();
});

export const verifyAdminOrSelf = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    const targetUserId = req.params.userId || req.params.id;
    const isAdmin = req.user.isAdmin;
    const isSelf = req.user._id.toString() === targetUserId;
    
    if (!isAdmin && !isSelf) {
        throw new ApiError(403, "Access denied: Admin privileges or own account required");
    }
    
    if (!req.user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }
    
    next();
});
