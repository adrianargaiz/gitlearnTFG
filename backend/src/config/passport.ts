import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { findOrCreateGithubUser } from '../services/authService';
import { environment } from './environment';

export function configurePassport(): void {
  const clientID = environment.github.clientId;
  const clientSecret = environment.github.clientSecret;
  const callbackURL = environment.github.callbackUrl;

  if (!clientID || !clientSecret || !callbackURL) {
    console.warn('GitHub OAuth not configured - GITHUB_CLIENT_ID/SECRET/CALLBACK_URL missing');
    return;
  }

  passport.use(
    new GitHubStrategy(
      { clientID, clientSecret, callbackURL, scope: ['user:email'] },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: unknown, user?: Express.User | false) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value ?? `${profile.id}@github.noemail`;
          const nombre = profile.displayName || profile.username || 'Usuario GitHub';
          const { token, user } = await findOrCreateGithubUser(profile.id, email, nombre);

          done(null, { ...user, _token: token } as unknown as Express.User);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
}
