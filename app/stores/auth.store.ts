import { authApi } from "~/apis/pre-built/1-auth.api";
import { toast } from "~/components/ui/toast";
import type {
  AuthUser,
  Login,
  Register,
  ResetPasswordWithOtp,
  ResetPasswordWithToken,
} from "~/types/pre-built/1-auth";
import { AccountTypeEnum } from "~/utils/enums";
import { handleApiError } from "~/utils/helpers/error-handler.helper";
import { storageHelper } from "~/utils/helpers/storage.helper";

export const useAuthStore = defineStore("auth", () => {
  const authUser = ref<AuthUser | null>(storageHelper.getAuth());
  const loading = ref<boolean>(false);

  const login = async (input: Login) => {
    const data = await _asyncHandler(() => authApi.login(input));

    return _updateAuth(data);
  };

  const register = async (input: Register) => {
    const data = await _asyncHandler(() => authApi.register(input));

    return _updateAuth(data);
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await _asyncHandler(() =>
      authApi.socialLogin({
        accountType: AccountTypeEnum.Google,
        idToken,
      }),
    );

    return _updateAuth(data);
  };

  const logout = async () => {
    await authApi.logout().catch((err) => handleApiError(err));

    // navigateTo('/auth/login');
    return _updateAuth(null);
  };

  const resetPasswordWithToken = async (input: ResetPasswordWithToken) => {
    const data = await _asyncHandler(() =>
      authApi.resetPasswordWithToken(input),
    );

    return _updateAuth(data);
  };

  const resetPasswordWithOtp = async (input: ResetPasswordWithOtp) => {
    const data = await _asyncHandler(() => authApi.resetPasswordWithOtp(input));

    return _updateAuth(data);
  };

  const getAccessToken = async () => {
    if (!authUser.value) return null;

    const currentMS = new Date().getTime();
    const { accessToken, refreshToken } = authUser.value;

    if (accessToken.expiresAt > currentMS) return accessToken.token;

    if (refreshToken.expiresAt < currentMS) return _updateAuth(null);

    await getAuthFromRefreshToken(refreshToken.token);

    return authUser.value?.accessToken?.token || null;
  };

  const getAuthFromRefreshToken = async (rfToken: string) => {
    try {
      const data = await authApi.refreshToken(rfToken);

      return _updateAuth(data);
    } catch (error) {
      handleApiError(error);
      return _updateAuth(null);
    }
  };

  const refreshAuthFromSession = async () => {
    const isRefreshed = sessionStorage.getItem("refreshed");

    if (isRefreshed && authUser.value) return;

    sessionStorage.setItem("refreshed", "true");

    if (!authUser.value?.refreshToken?.token) return;

    await getAuthFromRefreshToken(authUser.value.refreshToken.token);
  };

  /**
   * Set auth
   *
   * @param data
   */
  const _updateAuth = (data: AuthUser | null) => {
    if (data) {
      authUser.value = { ...authUser.value, ...data };
      storageHelper.setAuth(authUser.value);

      return authUser.value;
    }

    storageHelper.clearAuth();
    authUser.value = null;
    return authUser.value;
  };

  /**
   * async handler
   *
   * @param handler
   * @returns
   */
  const _asyncHandler = async (handler: () => Promise<AuthUser | null>) => {
    loading.value = true;

    try {
      const res = await handler();

      return res;
    } catch (error) {
      const { description, title } = handleApiError(error);
      toast({ description, title, variant: "destructive" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    authUser,
    loading,
    login,
    register,
    logout,
    getAccessToken,
    loginWithGoogle,
    resetPasswordWithOtp,
    resetPasswordWithToken,
    refreshAuthFromSession,
  };
});
