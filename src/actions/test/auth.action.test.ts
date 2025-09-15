/**
 * * @jest-environment jsdom
 * */
import { compare } from 'bcrypt';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getMongoDb } from '../../lib/mongodb';
import {
  decrypt,
  encrypt,
  getSession,
  isAuthenticated,
  login,
  logout,
} from '../auth.action';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
  jwtVerify: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('../../lib/mongodb', () => ({
  getMongoDb: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Auth Actions', () => {
  let mockCookiesSet: jest.Mock;
  let mockCookiesGet: jest.Mock;

  beforeEach(() => {
    mockCookiesSet = jest.fn();
    mockCookiesGet = jest.fn();
    (cookies as jest.Mock).mockReturnValue({
      set: mockCookiesSet,
      get: mockCookiesGet,
    });
    jest.clearAllMocks();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt a payload', async () => {
      const result = await encrypt({ foo: 'bar' });
      expect(result).toBe('mock.jwt.token');
      expect(SignJWT).toHaveBeenCalled();
    });

    it('should decrypt a valid token', async () => {
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { user: { _id: '123' } },
      });
      const result = await decrypt('mock.jwt.token');
      expect(result).toEqual({ user: { _id: '123' } });
    });

    it('should return null if token is invalid', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));
      const result = await decrypt('invalid.token');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should fail if user not found', async () => {
      (getMongoDb as jest.Mock).mockResolvedValue({
        collection: () => ({ findOne: jest.fn().mockResolvedValue(null) }),
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'pass123');

      const result = await login(null, formData);
      expect(result).toEqual({ formError: 'Incorrect email or password' });
    });

    it('should fail if password is invalid', async () => {
      (getMongoDb as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOne: jest
            .fn()
            .mockResolvedValue({ email: 'test', password: 'hash' }),
        }),
      });
      (compare as jest.Mock).mockResolvedValue(false);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrong');

      const result = await login(null, formData);
      expect(result).toEqual({ formError: 'Incorrect email or password' });
    });

    it('should succeed and set cookie', async () => {
      (getMongoDb as jest.Mock).mockResolvedValue({
        collection: () => ({
          findOne: jest
            .fn()
            .mockResolvedValue({ _id: '1', email: 'test', password: 'hash' }),
        }),
      });
      (compare as jest.Mock).mockResolvedValue(true);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'valid');

      await login(null, formData);

      expect(mockCookiesSet).toHaveBeenCalledWith(
        'session',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('logout', () => {
    it('should clear the session cookie', async () => {
      await logout();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        'session',
        '',
        expect.any(Object),
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return null if no session cookie', async () => {
      mockCookiesGet.mockReturnValue(undefined);
      const result = await isAuthenticated();
      expect(result).toBeNull();
    });

    it('should return user if session is valid', async () => {
      mockCookiesGet.mockReturnValue({ value: 'mock.jwt.token' });
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { user: { _id: '1' } },
      });

      const result = await isAuthenticated();
      expect(result).toEqual({ _id: '1' });
    });

    it('should return null if session invalid', async () => {
      mockCookiesGet.mockReturnValue({ value: 'invalid' });
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('bad token'));

      const result = await isAuthenticated();
      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return user if authenticated', async () => {
      mockCookiesGet.mockReturnValue({ value: 'mock.jwt.token' });
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { user: { _id: '42' } },
      });

      const result = await getSession();
      expect(result).toEqual({ _id: '42' });
    });

    it('should redirect if not authenticated', async () => {
      mockCookiesGet.mockReturnValue(undefined);
      await getSession();
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });
});
