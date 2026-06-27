// ─────────────────────────────────────────────────────────────────────────────
// features/user-info/types/user-info.types.ts
//
// Type definitions for Colombia DIAN User Info Billing Profiles.
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonaNaturalBilling {
  id: string;
  userId: string;
  tipoDocumento: "CC" | "CE" | "PA" | "NIT";
  numeroDocumento: string;
  primerNombre: string;
  primerApellido: string;
  tipoPersonaNacionalidad: "Nacional" | "Extranjero";
  responsabilidadesFiscales: string;
  regimenTributario: string;
  regimenFiscalIva: string;
  correoElectronicoRut: string;
  direccion: string;
  departamento: string;
  municipio: string;
  certificadoFirma: string;
  modoOperacion: string;
  prefijoNumeracion: string;
  rangoDesde: number;
  rangoHasta: number;
  resolucionDian: string;
  fechaResolucion: string;
  fechaVigencia: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaJuridicaBilling {
  id: string;
  userId: string;
  tipoDocumento: "NIT";
  numeroNit: string;
  digitoVerificacion: string;
  razonSocial: string;
  tipoOrganizacion: string;
  codigoCiiu: string;
  repLegalTipoDoc: "CC" | "CE" | "PA";
  repLegalNumeroDoc: string;
  repLegalNombres: string;
  repLegalApellidos: string;
  repLegalEmail: string;
  responsabilidadesFiscales: string;
  regimenTributario: string;
  regimenFiscalIva: string;
  correoElectronicoRut: string;
  direccion: string;
  departamento: string;
  municipio: string;
  certificadoFirma: string;
  modoOperacion: string;
  prefijoNumeracion: string;
  rangoDesde: number;
  rangoHasta: number;
  resolucionDian: string;
  fechaResolucion: string;
  fechaVigencia: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingProfile {
  type: "NATURAL" | "JURIDICA";
  data: PersonaNaturalBilling | PersonaJuridicaBilling;
}
