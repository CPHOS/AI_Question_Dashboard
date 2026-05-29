import { apiClient } from './client';
import type { HealthStatus, VersionInfo } from './types';

/** Backend version & license info (public; also proves connectivity). */
export async function getVersion(): Promise<VersionInfo> {
  const { data } = await apiClient.get<VersionInfo>('/version');
  return data;
}

/** Service & component-level health (public). Drives the footer indicator. */
export async function getHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
}
