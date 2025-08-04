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

export const CREATE_STORE = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
    }
  }
`;

export const CREATE_STORE_SESSION = gql`
  mutation CreateStoreSession($input: StoreSessionInput!) {
    createStoreSession(input: $input) {
      id
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $input: CreateProductInput!
    $inventory: CreateInventoryInput!
  ) {
    createProduct(input: $input, inventory: $inventory)
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $input: UpdateProductInput!
    $inventory: UpdateInventoryInput
  ) {
    updateProduct(input: $input, inventory: $inventory)
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($id: String!) {
    deleteInventory(id: $id)
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($input: UpdateInventoryInput!) {
    updateInventory(input: $input)
  }
`;

export const CREATE_INVENTORY_MOVEMENT = gql`
  mutation CreateInventoryMovement($input: CreateInventoryMovementInput!) {
    createInventoryMovement(input: $input) {
      id
    }
  }
`;

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      id
    }
  }
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($input: UpdateSupplierInput!) {
    updateSupplier(input: $input)
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: String!) {
    deleteSupplier(id: $id)
  }
`;

export const CREATE_PRODUCT_CATEGORY = gql`
  mutation CreateProductCategory($input: CreateProductCategoryInput!) {
    createProductCategory(input: $input) {
      id
    }
  }
`;

export const UPDATE_PRODUCT_CATEGORY = gql`
  mutation UpdateProductCategory($input: UpdateProductCategoryInput!) {
    updateProductCategory(input: $input)
  }
`;

export const DELETE_PRODUCT_CATEGORY = gql`
  mutation DeleteProductCategory($id: String!) {
    deleteProductCategory(id: $id)
  }
`;

export const CREATE_REORDER_REQUEST = gql`
  mutation CreateReorderRequest($input: CreateReorderRequestInput!) {
    createReorderRequest(input: $input) {
      id
    }
  }
`;

export const UPDATE_REORDER_REQUEST = gql`
  mutation UpdateReorderRequest($input: UpdateReorderRequestInput!) {
    updateReorderRequest(input: $input)
  }
`;
