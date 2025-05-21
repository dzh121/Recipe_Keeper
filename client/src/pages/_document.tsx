import { Html, Head, Main, NextScript } from "next/document";

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        {recaptchaSiteKey && (
          <script
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
            async
            defer
          ></script>
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
