import { CEYFI_JSON_LD } from "@/lib/seo";

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(CEYFI_JSON_LD) }}
    />
  );
}
