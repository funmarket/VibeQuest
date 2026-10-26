import { geoConsentSchema, geoObservationSchema } from "@vq/contracts";
import type { GeoActor, GeoRepository } from "../domain/ports";
import { validateReading } from "../domain/policy";
export function createGeo(repository: GeoRepository) {
  return {
    read: (actor: GeoActor) => repository.read(actor),
    consent: (actor: GeoActor, input: unknown) =>
      repository.consent(actor, geoConsentSchema.parse(input)),
    observe(actor: GeoActor, input: unknown) {
      const parsed = geoObservationSchema.parse(input);
      const { version, ...reading } = parsed;
      validateReading(reading, Date.now());
      return repository.observe(actor, { ...reading, version });
    },
    unavailable: (actor: GeoActor) => repository.unavailable(actor),
    logout: repository.logout,
    cleanup: repository.cleanup,
  };
}
