import { gql } from "@apollo/client";

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      email
      emailVerificationToken
      isEmailVerified
      role
      full_name
      username
      avatar_url
      phone
      position
      position_type
      specialties
      availability_preferences
      performance_metrics
      business {
        id
        name
        email
        phone
        address
        subscription_plan
        subscription_status
        invitation_code
        settings
        created_at
        updated_at
      }
    }
  }
`;

export const GET_BUSINESS_STATS = gql`
  query GetBusinessStats($id: String!) {
    getBusinessStats(id: $id) {
      productsCount
      storesCount
      membersCount
    }
  }
`;

export const GET_INVENTORY_STATS = gql`
  query GetInventoryStats {
    getInventoryStats {
      productsCount
      lowStockItemsCount
      outOfStockCount
      totalValue
    }
  }
`;

export const GET_INVENTORY = gql`
  query GetInventoryByBusiness(
    $pagination: PaginationInput!
    $filters: InventoryFilterInput
  ) {
    getInventoryByBusiness(pagination: $pagination, filters: $filters) {
      data {
        id
        is_low_stock
        is_out_of_stock
        is_overstocked
        quantity_available
        quantity_on_hand
        low_stock_threshold
        store {
          id
        }
        product {
          id
          name
          sku
          barcode
          cost
          price
          minimum_price
          supplier {
            id
            name
          }
          category {
            id
            name
          }
          image_url
          description
          is_active
        }
      }
      count
    }
  }
`;

export const GET_LOW_STOCK_INVENTORY = gql`
  query GetLowStockInventoryByBusiness(
    $pagination: PaginationInput!
    $filters: InventoryFilterInput
  ) {
    getLowStockInventoryByBusiness(pagination: $pagination, filters: $filters) {
      data {
        id
        is_low_stock
        is_out_of_stock
        is_overstocked
        quantity_available
        quantity_on_hand
        low_stock_threshold
        store {
          id
        }
        product {
          id
          name
          sku
          barcode
          cost
          price
          minimum_price
          category {
            id
            name
          }
          supplier {
            id
            name
          }
          image_url
          description
          is_active
        }
      }
      count
    }
  }
`;

export const GET_PRODUCTS = gql`
  query GetProductsByBusiness($pagination: PaginationInput!) {
    getProductsByBusiness(pagination: $pagination) {
      data {
        id
        name
        sku
        barcode
        cost
        price
        minimum_price
        category {
          id
          name
        }
        supplier {
          id
          name
        }
        image_url
        description
        is_active
      }
      count
    }
  }
`;

export const GET_SUPPLIERS = gql`
  query GetSuppliers {
    getSuppliers {
      id
      name
      contact_person
      email
      phone
      address
      notes
      status
      created_at
      updated_at
    }
  }
`;

export const GET_INVENTORY_MOVEMENTS = gql`
  query GetMovementsByBusiness($pagination: PaginationInput!) {
    getMovementsByBusiness(pagination: $pagination) {
      count
      data {
        id
        store {
          id
        }
        product {
          id
          name
          sku
        }
        created_by {
          id
          full_name
          email
        }
        movement_type
        quantity_change
        previous_quantity
        new_quantity
        reference_id
        reference_type
        notes
        created_at
        updated_at
      }
    }
  }
`;
