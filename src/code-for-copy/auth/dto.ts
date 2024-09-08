export class LoginDto {
  readonly email: string;
  readonly password: string;
}

export class RegisterDto {
  readonly password: string;
  readonly email: string;
}
export class CreateDto {
  readonly passwordHash: string;
  readonly email: string;
}