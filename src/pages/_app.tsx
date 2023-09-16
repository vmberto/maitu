import Head from 'next/head';
import 'src/styles/globals.css';
import { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Maitu</title>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
