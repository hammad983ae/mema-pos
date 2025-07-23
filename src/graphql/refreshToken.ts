import { fetchRequestClient } from './client';

const REFRESH_ACCESS_TOKEN_LIT = `
  mutation RefreshAccessToken($refreshToken: String!) {
    refreshAccessToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const refreshTokenReq = async (refreshAccessToken: string) => {
  try {
    const response = await fetchRequestClient({
      query: REFRESH_ACCESS_TOKEN_LIT,
      variables: {
        refreshToken: refreshAccessToken,
      },
    });
    // console.log('refreshToken response', response);
    if (!response?.data?.refreshAccessToken)
      throw new Error('refreshToken error');
    return {
      accessToken: response.data.refreshAccessToken.accessToken as string,
      refreshToken: response.data.refreshAccessToken.refreshToken as string,
    };
  } catch (error) {
    // console.error('refreshToken error', error);
    throw error;
  }
};
