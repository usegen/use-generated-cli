import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { scrypt, randomBytes } from 'crypto';
import { AuthUserService } from './auth-user.service';
import { LoginDto, RegisterDto } from './dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: AuthUserService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user) {
      
      const isValid = await this.comparePassword(password, user.passwordHash);

      if (isValid) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }
  async login(email: string, password: string): Promise<{ access_token: string }> {
    // Validate the user's credentials
   
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
  
    // If the credentials are valid, generate an access token
    const payload = { email: user.email, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    // generate a password reset token
    const token = randomBytes(32).toString('hex');

    // store the hashed token in the database
    const user = await this.userService.findOne(email);
    await this.userService.updateToken(email, token);

    // send an email with the password reset link

    await  this.mailerService.sendMail({
      to: email,
      from: 'noreply@nestjs.com',
      subject: 'Password Reset',
      template: 'reset-password', // Make sure there is a `reset-password.hbs` template
      context: {
        // Data to be sent to template engine.
        name: `${user.id} - ${user.email}`,
        link: `http://localhost:3000/reset-password?token=${token}`,
      },
    })
  }


  async finishForgotPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.userService.findByToken(token);
    if (!user) {
      throw new Error('Token is invalid or has expired');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.userService.updatePassword(user.id, hashedPassword);
    await this.userService.updateToken(user.email, '');
    return true;
  }


  async signup(user: RegisterDto): Promise<void> {

    const createInput = {...user,
      passwordHash: await this.hashPassword(user.password)
    }
    await this.userService.create(createInput);
  }
  async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      scrypt(password, process.env.SALT, 64, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey.toString('hex') === passwordHash);
        }
      });
    });
  }
  async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      scrypt(password, process.env.SALT, 64, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey.toString('hex'));
        }
      });
    });
  }
  async changePasswordBasedOnOld(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Old password is incorrect');
    }


    const hashedPassword = await this.hashPassword(newPassword);
    await this.userService.updatePassword(userId, hashedPassword);
    return true;
  }
}