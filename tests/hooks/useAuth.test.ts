import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, User } from '@/hooks/useAuth';
import * as authApi from '@/lib/api/user-service';

// Mock the auth API
jest.mock('@/lib/api/auth');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('useAuth', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('should reflect unauthenticated state', async () => {
        mockAuthApi.isAuthenticated.mockReturnValue(false);
        mockAuthApi.getAuthToken.mockReturnValue(null);
        mockAuthApi.getUserData.mockReturnValue(null);

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
    });

    it('should reflect authenticated state if user is authenticated', async () => {
        const mockUser: User = { id: '1', email: 'test@example.com' };
        const mockToken = 'test-token';

        mockAuthApi.isAuthenticated.mockReturnValue(true);
        mockAuthApi.getAuthToken.mockReturnValue(mockToken);
        mockAuthApi.getUserData.mockReturnValue(mockUser);

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toEqual(mockToken);
    });

    it('should update auth state when updateAuthState is called', async () => {
        mockAuthApi.isAuthenticated.mockReturnValue(false);
        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const mockUser: User = { id: '2', email: 'new@example.com' };
        const mockToken = 'new-token';

        act(() => {
            result.current.updateAuthState(mockToken, mockUser);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toEqual(mockToken);
    });

    it('should clear auth state when clearAuth is called', async () => {
        const mockUser: User = { id: '1', email: 'test@example.com' };
        const mockToken = 'test-token';

        mockAuthApi.isAuthenticated.mockReturnValue(true);
        mockAuthApi.getAuthToken.mockReturnValue(mockToken);
        mockAuthApi.getUserData.mockReturnValue(mockUser);

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        act(() => {
            result.current.clearAuth();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(mockAuthApi.clearAuthData).toHaveBeenCalledTimes(1);
    });
}); 