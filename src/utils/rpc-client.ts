import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

const link = new RPCLink({
  url: `${baseUrl}/rpc`,
});

/**
 * Type-safe oRPC client for fillx_backend.
 * Usage: const data = await rpc.earthquakes();
 */
export const rpc = createORPCClient<any>(link);
