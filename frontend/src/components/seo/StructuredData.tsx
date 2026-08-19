import { useEffect } from 'react';

interface StructuredDataProps {
  schema: Record<string, unknown>;
  id?: string;
}

/**
 * StructuredData — injects JSON-LD structured data into the document <head>.
 * Used on public pages to help search engines understand the content.
 *
 * Usage:
 *   <StructuredData schema={{ "@context": "https://schema.org", "@type": "Organization", ... }} />
 */
const StructuredData: React.FC<StructuredDataProps> = ({ schema, id = 'structured-data-default' }) => {
  useEffect(() => {
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [schema, id]);

  return null;
};

export default StructuredData;
