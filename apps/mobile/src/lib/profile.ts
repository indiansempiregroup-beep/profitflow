import { useQuery } from '@tanstack/react-query';
import { fetcher, CACHE_KEYS } from './api';

export interface UserProfile {
  id: string;
  email: string;
}

export interface ProfileResponse {
  success: boolean;
  user: UserProfile;
  connectedExchanges: string[];
  exchangeConnectionCount: number;
}

export const fetchProfile = async (): Promise<ProfileResponse> =>
  fetcher<ProfileResponse>('/profile', undefined, CACHE_KEYS.profile);

export const useProfile = () =>
  useQuery<ProfileResponse, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchInterval: false,
  });
