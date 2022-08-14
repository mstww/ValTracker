import Document, { Html, Head, Main, NextScript } from 'next/document';
import { CssBaseline } from '@nextui-org/react';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: [<div key={this}>{initialProps.styles}</div>]
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {CssBaseline.flush()}
        </Head>
        <body className='bg-maincolor-light'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;