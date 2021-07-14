import React from 'react';
import {ApolloClient,ApolloProvider, InMemoryCache, createHttpLink} from '@apollo/client';
import { Redirect } from '@shopify/app-bridge/actions';
import { Context, useAppBridge } from '@shopify/app-bridge-react'
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { onError } from "@apollo/client/link/error";


function userLoggedInFetch(app) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);

    if (
      response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
    ) {
      const authUrlHeader = response.headers.get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url"
      );

      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }

    return response;
  };
}


const MyProvider = props => {
  const app = useAppBridge()
 
  const client = new ApolloClient({
      link: new createHttpLink({
        fetch: userLoggedInFetch(app),
        credentials: 'include',
        headers: {
          "Content-Type" : "application/graphql",
        }
      }),
      cache: new InMemoryCache(),
    });
    return(
        <ApolloProvider client={client} >
            {props.children}
        </ApolloProvider>
    )   
}



export default MyProvider
