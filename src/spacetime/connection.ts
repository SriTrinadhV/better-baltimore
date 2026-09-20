import { DbConnection } from "./module_bindings";

const SPACETIME_URI = import.meta.env.VITE_SPACETIMEDB_URI ?? "ws://localhost:3000";
const SPACETIME_DB = import.meta.env.VITE_SPACETIMEDB_MODULE ?? "better-baltimore";

export interface ConnectHandlers {
  onConnect?: (conn: DbConnection) => void;
  onDisconnect?: () => void;
  onConnectError?: (err: Error) => void;
}

export function connect(handlers: ConnectHandlers): DbConnection {
  return DbConnection.builder()
    .withUri(SPACETIME_URI)
    .withDatabaseName(SPACETIME_DB)
    .onConnect((conn) => handlers.onConnect?.(conn))
    .onDisconnect(() => handlers.onDisconnect?.())
    .onConnectError((_ctx, err) => handlers.onConnectError?.(err))
    .build();
}
