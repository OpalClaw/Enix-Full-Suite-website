// Ambient declaration for docusign-esign (no upstream typings as of 8.x).
// We only use the parts we wrap in services/docusign.ts; everything is
// intentionally `any` so we don't fight a misaligned shim.
declare module "docusign-esign" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: any;
  export default m;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class ApiClient { [k: string]: any; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class EnvelopesApi { [k: string]: any; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type EnvelopeDefinition = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Recipients = any;
}
