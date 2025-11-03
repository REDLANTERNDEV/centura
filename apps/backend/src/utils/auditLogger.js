import pool from '../config/db.js';

/**
 * Audit Logger Utility
 * Logs important system events to the audit_logs table
 * For compliance, security tracking, and debugging
 */

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {number} [params.userId] - ID of the user performing the action
 * @param {string} [params.userEmail] - Email of the user
 * @param {string} [params.userRole] - Role of the user at time of action
 * @param {number} [params.impersonatingUserId] - ID of impersonating user (for support access)
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, LOGIN, VIEW, EXPORT, etc.)
 * @param {string} params.resourceType - Type of resource affected (user, organization, product, customer, order, etc.)
 * @param {string|number} [params.resourceId] - ID of the affected resource
 * @param {number} [params.orgId] - Organization context (optional)
 * @param {Object} [params.oldValue] - Object containing values before change
 * @param {Object} [params.newValue] - Object containing values after change
 * @param {Object} [params.metadata] - Additional metadata
 * @param {string} [params.ipAddress] - IP address of the request
 * @param {string} [params.userAgent] - User agent string
 * @param {string} [params.requestPath] - HTTP request path
 * @param {string} [params.requestMethod] - HTTP method (GET, POST, PUT, DELETE)
 * @param {boolean} [params.success] - Whether the action succeeded (default: true)
 * @param {string} [params.errorMessage] - Error message if action failed
 */
export async function logAudit({
  userId = null,
  userEmail = null,
  userRole = null,
  impersonatingUserId = null,
  action,
  resourceType,
  resourceId = null,
  orgId = null,
  oldValue = null,
  newValue = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
  requestPath = null,
  requestMethod = null,
  success = true,
  errorMessage = null,
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
        (user_id, user_email, user_role, impersonating_user_id, action, resource_type, 
         resource_id, org_id, old_value, new_value, metadata, ip_address, user_agent, 
         request_path, request_method, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        userId,
        userEmail,
        userRole,
        impersonatingUserId,
        action,
        resourceType,
        resourceId ? String(resourceId) : null,
        orgId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        success,
        errorMessage,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the main operation
    console.error('Audit logging failed:', error);
  }
}

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Type of resource
 * @param {string|number} resourceId - ID of the resource
 * @param {number} [limit=50] - Maximum number of logs to retrieve
 */
export async function getAuditLogs(resourceType, resourceId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email_from_user
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.resource_type = $1 AND al.resource_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3`,
      [resourceType, String(resourceId), limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a user
 * @param {number} userId - ID of the user
 * @param {number} [limit=50] - Maximum number of logs to retrieve
 */
export async function getUserAuditLogs(userId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to retrieve user audit logs:', error);
    return [];
  }
}
