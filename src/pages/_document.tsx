import {Head, Html, Main, NextScript} from 'next/document';


export default function Document() {
    return (
        <Html lang="pt-br">
            <Head>
                <meta charSet="utf-8"/>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
                <meta name="description" content="Description"/>
                <meta name="keywords" content="Keywords"/>
                <link rel="manifest" href="/manifest.json"/>
                <link rel="apple-touch-icon" href="/touch-icon.png"></link>
                <meta name="theme-color" content="#317EFB"/>
            </Head>
            <body>
            <Main/>
            <NextScript/>
            </body>
        </Html>
    );
}
