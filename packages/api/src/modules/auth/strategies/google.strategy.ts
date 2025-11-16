import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName, photos } = profile;

    // For OAuth, we need to get tenant from somewhere
    // This could be from state parameter or default tenant
    const defaultTenantId = this.configService.get<string>('DEFAULT_TENANT_ID');

    const result = await this.authService.oauthLogin({
      tenantId: defaultTenantId, // TODO: Get from state parameter
      email: emails[0].value,
      name: displayName,
      provider: 'google',
      avatarUrl: photos?.[0]?.value,
    });

    done(null, result);
  }
}
