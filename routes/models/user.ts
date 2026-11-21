export class User {
  public id?: number
  public username?: string
  public email?: string
  public hashpass?: string
  public role: number = 0 // 0 = standard user, 1 = admin
  public deleted: boolean = false
}

export class UserPublic {
  public id: number
  public username: string
  public email: string
  public role: number
}

export class UserAdmin {
  public id: number
  public username: string
  public email: string
  public role: number
  public deleted: boolean = false
}

export class UserLogin {
  public username?: string
  public email?: string
  public password_clear: strings
}

export class UserRegistration {
  public username: string
  public email: string
  public password_clear: string
  public lobby_code: number
}
