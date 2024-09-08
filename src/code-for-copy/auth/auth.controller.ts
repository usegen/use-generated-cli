import { Body,Get, Controller, Post} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Query } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string,@Body('password') password: string) {
    return this.authService.login(email,password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }
  
  @Get('finish-forgot-password')
  async resetPassword(
    @Query('token') token: string,
    @Query('newPassword') newPassword: string
  ) {
    return this.authService.finishForgotPassword(token,newPassword);
  }
 
  @Post('signup')
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.signup(registerDto);
  }
}