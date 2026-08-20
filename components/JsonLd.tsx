// Renders one JSON-LD <script> into the page.
//
// A plain server component, NOT next/script: structured data has to be present
// in the initial HTML. A large share of this site's traffic arrives in the
// Facebook/Instagram in-app browsers, and crawlers likewise may never execute
// JS — anything injected client-side is invisible to them. Rendering it inline
// costs nothing and is always there.
//
// dangerouslySetInnerHTML is required (React escapes text children, which would
// corrupt the JSON). The `<` escape below closes the one real injection vector:
// if any product field from Shopify ever contained "</script>", the browser
// would end the script tag early and treat the rest as markup. Escaping to
// < keeps it valid JSON with identical parsed values.
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
