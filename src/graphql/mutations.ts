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

export const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail
  }
`;

export const CREATE_BUSINESS = gql`
  mutation CreateBusiness($input: CreateBusinessInput!) {
    createBusiness(input: $input) {
      id
    }
  }
`;

export const UPDATE_BUSINESS = gql`
  mutation UpdateBusiness($input: UpdateBusinessInput!) {
    updateBusiness(input: $input)
  }
`;

export const CREATE_STORE = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
    }
  }
`;

export const UPDATE_STORE = gql`
  mutation UpdateStore($input: UpdateStoreInput!) {
    updateStore(input: $input)
  }
`;

export const DELETE_STORE = gql`
  mutation DeleteStore($id: String!) {
    deleteStore(id: $id)
  }
`;

export const CREATE_STORE_SESSION = gql`
  mutation CreateStoreSession($input: StoreSessionInput!) {
    createStoreSession(input: $input) {
      id
      store {
        id
        name
      }
      session_date
      opened_by {
        id
        full_name
        email
        role
      }
      opened_at
      closed_by {
        id
        full_name
        email
        role
      }
      closed_at
      is_active
      opening_cash_amount
      closing_cash_amount
      expected_cash_amount
      cash_variance
      total_sales
      total_transactions
      status
      notes
      created_at
      updated_at
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

export const CREATE_STORE_LOCATION = gql`
  mutation CreateStoreLocation($input: CreateStoreLocationInput!) {
    createStoreLocation(input: $input) {
      id
    }
  }
`;

export const UPDATE_STORE_LOCATION = gql`
  mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {
    updateStoreLocation(input: $input)
  }
`;

export const DELETE_STORE_LOCATION = gql`
  mutation DeleteStoreLocation($id: String!) {
    deleteStoreLocation(id: $id)
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

export const CREATE_RECEIPT = gql`
  mutation CreateReceipt($input: CreateReceiptInput!) {
    createReceipt(input: $input) {
      id
      receipt_number
      sub_total
      discount_total
      tax_total
      grand_total
      notes
      created_at
      updated_at
    }
  }
`;
