import getUidUtil from '../utils/get-uid.js';
import getGidUtil from '../utils/get-gid.js';
import getUsernameUtil from '../utils/get-username.js';

/**
 * Returns the id of the current user or username.
 *
 * Note that on Windows this value is more or less worthless and `username` has
 * has no effect
 *
 * @since 3.0.0
 * @alias lando.user.getUid
 * @return {String} The user ID.
 * @example
 * // Get the id of the user.
 * const userId = lando.user.getUid();
 */
export const getUid = () => getUidUtil();

/**
* Returns the gid of the current user or username.
*
* Note that on Windows this value is more or less worthless and `username` has
* has no effect
 *
 * @since 3.0.0
 * @alias lando.user.getGid
 * @return {String} The group ID.
 * @example
 * // Get the id of the user.
 * const groupId = lando.user.getGid();
 */
export const getGid = () => getGidUtil();

/**
* Returns the username of the current user
*
* Note that on Windows this value is more or less worthless and `username` has
* has no effect
 *
 * @since 3.0.0
 * @alias lando.user.getGid
 * @return {String} The group ID.
 * @example
 * // Get the id of the user.
 * const groupId = lando.user.getGid();
 */
export const getUsername = () => getUsernameUtil();

// Default export for backward compatibility
export default {getUid, getGid, getUsername};
