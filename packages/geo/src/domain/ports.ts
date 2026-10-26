import type { GeoConsent, GeoObservation, GeoState } from "@vq/contracts";
export type GeoActor = {
  userId: string;
  sessionKey: string;
  sessionExpiresAt: string;
};
export interface GeoRepository {
  read(actor: GeoActor): Promise<GeoState>;
  consent(actor: GeoActor, input: GeoConsent): Promise<GeoState>;
  observe(actor: GeoActor, input: GeoObservation): Promise<GeoState>;
  unavailable(actor: GeoActor): Promise<GeoState>;
  logout(sessionKey: string): Promise<void>;
  cleanup(): Promise<void>;
}
