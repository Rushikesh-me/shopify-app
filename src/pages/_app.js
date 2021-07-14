import React, { useEffect } from 'react'
import { AppProvider } from "@shopify/polaris";
import { Provider, TitleBar } from "@shopify/app-bridge-react";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import '../../styles/globals.css'
import MyProvider from '../components/apolloClient';

const MyApp = ({Component, pageProps, host}) => {
  const secondaryActions = [{content: 'Generate Store Discount', url: '/storeDiscount'}, {content: 'Generate Product Discount', url: '/productDiscount'}];

 const display = (
   <React.Fragment>     
     <AppProvider i18n={translations}>
        <Provider
          config={{
            apiKey: API_KEY,
            host: host,
            forceRedirect: true,
          }}
        >
          <TitleBar
          title= "Email Notifier"
        secondaryActions={secondaryActions}
          />
          <MyProvider>
            <Component {...pageProps} />
          </MyProvider>
        </Provider>
      </AppProvider>
      </React.Fragment>
    );
    return display;
}

MyApp.getInitialProps = async ({ ctx }) => {
  return {
    host: ctx.query.host,
  };
};

export default MyApp;
