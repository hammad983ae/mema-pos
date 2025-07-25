import { gql } from "@apollo/client";

export const LOGIN_BUSINESS_OWNER = gql`
  mutation LoginBusinessOwner($input: LoginInput!) {
    loginBusinessOwner(input: $input) {
      access_token
    }
  }
`;

export const REGISTER_BUSINESS_OWNER = gql`
  mutation RegisterBusinessOwner($input: RegisterInput!) {
    registerBusinessOwner(input: $input) {
      access_token
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const CREATE_BUSINESS = gql`
  mutation CreateBusiness($input: BusinessInput!) {
    createBusiness(input: $input) {
      id
    }
  }
`;

export const UPDATE_BUSINESS = gql`
  mutation UpdateBusiness($id: String!, $input: BusinessInput!) {
    updateBusiness(id: $id, input: $input)
  }
`;

export const CREATE_STORE_SESSION = gql`
  mutation CreateStoreSession($input: StoreSessionInput!) {
    createStoreSession(input: $input) {
      id
    }
  }
`;
