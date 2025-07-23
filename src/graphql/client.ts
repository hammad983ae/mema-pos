import {
  ApolloClient,
  ApolloLink,
  DocumentNode,
  from,
  HttpLink,
  InMemoryCache,
  OperationVariables,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "apollo-link-context";
import { refreshTokenReq } from "./refreshToken";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { showError } from "@/hooks/useToastMessages.tsx";

const SERVER_URL_GQL = import.meta.env.VITE_SERVER_URL as string;

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, response, forward }) => {
    if (graphQLErrors || networkError || response) {
      operation.query.definitions.forEach((definition) => {
        const op = "operation" in definition ? definition.operation : "";
        console.log(
          `[Operation Mema] apollo ${op} ${operation.operationName || ""}`,
        );
      });
    }

    if (response) {
      console.log(`[Operation Result Mema] ${JSON.stringify(response)}`);
    }

    if (graphQLErrors) {
      graphQLErrors.forEach(async ({ message, locations, path }) => {
        const locationsStr = JSON.stringify(locations);
        if (message !== "jwt malformed") showError(message);

        console.warn(
          `[GraphQL Error Mema] Message: "${message}", Locations: ${locationsStr}, Path: "${path}"`,
        );
        if (message === "jwt expired") {
          //refresh token
          const refreshAccessToken = localStorage.getItem("refreshToken");
          if (!refreshAccessToken)
            return console.error("refreshAccessToken not found");
          const res = await refreshTokenReq(refreshAccessToken);
          if (!res) return console.error("refreshTokenReq error");
          localStorage.setItem("token", res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken);
          operation.setContext(({ headers = {} }: Record<string, any>) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${res.accessToken}`, // should the same with Auth link
            },
          }));
          return forward(operation);
        }
      });
    }

    if (networkError) {
      console.error(`[Network Error Mema] "${networkError}"`);
    }
  },
);

const httpLink = new HttpLink({
  uri: SERVER_URL_GQL,
});

const authMiddleware = setContext((operation) => {
  const accessToken = localStorage.getItem("accessToken");

  return {
    // Make sure to actually set the headers here
    headers: {
      authorization: accessToken ? `Bearer ${accessToken}` : null,
    },
  };
});

const client = new ApolloClient({
  link: from([errorLink, authMiddleware as unknown as ApolloLink, httpLink]),
  cache: new InMemoryCache(),
  // connectToDevTools: true,
});

export const fetchRequestClient = async ({
  query,
  variables,
}: {
  query: DocumentNode | string;
  variables: OperationVariables;
}) => {
  try {
    const res = await fetch(SERVER_URL_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    return await res.json();
  } catch (err) {
    console.log("request failed with", err);
    return await Promise.reject(err);
  }
};

const middleware = new ApolloLink((operation, forward) => {
  const headers = {
    "apollo-require-preflight": "true",
  };

  // add the authorization to the headers
  operation.setContext({
    headers,
  });

  return forward(operation);
});

const uploadHttpLink = createUploadLink({
  uri: SERVER_URL_GQL, // Replace with your GraphQL endpoint
});

export const uploadClient = new ApolloClient({
  link: from([errorLink, middleware, uploadHttpLink]),
  cache: new InMemoryCache(),
});

export default client;
