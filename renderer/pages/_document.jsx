import Document, { Html, Head, Main, NextScript } from 'next/document';
import { CssBaseline } from '@nextui-org/react';
import fs from 'fs';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: [<div key={this}>{initialProps.styles}</div>]
    };
  }

  render() {
    const loadData = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));
    return (
      <Html>
        <Head>
          {CssBaseline.flush()}
        </Head>
        <body lang={loadData.appLang} className='bg-maincolor-light'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;