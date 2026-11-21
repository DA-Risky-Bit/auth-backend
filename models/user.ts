/**
 * Represents a full user entity, mapped directly from the database.
 */
export class User {
  constructor(
    public id?: number,
    public username?: string,
    public email?: string,
    public hashpass?: string,
    public role: number = 0, // 0 = standard user, 1 = admin
    public deleted: boolean = false
  ) {}
}

/**
 * Represents a sanitized public-facing user profile, omitting sensitive fields like password hashes.
 */
export class UserProfilePublic {
  constructor(
    public id: number,
    public username: string,
    public role: number
  ) {}
}

/**
 * Represents a sanitized public-facing user profile for themselves and admins, omitting sensitive fields like password hashes.
 */
export class UserProfileDetailed {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public role: number,
    public deleted: boolean = false
  ) {}
}

/**
 * Represents an administrative view of a user, including backend fields like deletion status.
 */
export class UserAdmin {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public role: number,
    public deleted: boolean = false
  ) {}
}

/**
 * Represents the credentials payload provided by a user during login.
 */
export class UserLogin {
  constructor(
    public username?: string,
    public email?: string,
    public password_clear?: string
  ) {}
}

/**
 * Represents the required payload for registering a new user account.
 */
export class UserRegistration {
  constructor(
    public username: string,
    public email: string,
    public password_clear: string,
    public lobby_code: number
  ) {}
}
