import jwt from 'jsonwebtoken';

export const generateTokens = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_prod';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_do_not_use';

  const accessToken = jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign({ id: userId }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  // Set Access Token cookie
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Set Refresh Token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return { accessToken, refreshToken };
};

export const clearTokens = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};
