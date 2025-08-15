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
      pos_pin
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

export const GET_OWNERS_AND_MANAGERS = gql`
  query GetOwnersAndManagersOfBusiness {
    getOwnersAndManagersOfBusiness {
      id
    }
  }
`;

export const GET_USERS_BY_BUSINESS = gql`
  query GetUsersByBusiness($search: String) {
    getUsersByBusiness(search: $search) {
      id
      email
      full_name
      role
      username
    }
  }
`;

export const GET_EMPLOYEE_CLOCKS = gql`
  query GetEmployeeClocksByBusiness($filters: EmployeeClockStatusFilterInput) {
    getEmployeeClocksByBusiness(filters: $filters) {
      id
      user {
        id
        full_name
        email
        username
        avatar_url
        role
        position_type
      }
      clocked_in_at
      clocked_out_at
      is_active
      created_at
      updated_at
    }
  }
`;

export const GET_USER_ACTIVE_CLOCK = gql`
  query FindUserActiveEmployeeClock($userId: String!) {
    findUserActiveEmployeeClock(userId: $userId) {
      id
      store {
        id
        name
      }
      user {
        id
        full_name
        username
        email
        avatar_url
        role
      }
      clocked_in_at
      clocked_out_at
      is_active
      created_at
      updated_at
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
        max_stock_level
        low_stock_threshold
        store {
          id
          name
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
        max_stock_level
        low_stock_threshold
        store {
          id
          name
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
  query GetProductsByBusiness(
    $pagination: PaginationInput!
    $filters: ProductFilterInput
    $storeId: String
  ) {
    getProductsByBusiness(
      pagination: $pagination
      filters: $filters
      storeId: $storeId
    ) {
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
        inventoryCount
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
          name
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

export const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
      description
      is_active
      productsCount
    }
  }
`;

export const GET_STORES = gql`
  query GetStores {
    getStores {
      id
      name
      address
      phone
      email
      pin
      tax_rate
      is_active
      is_main
      created_at
      updated_at
      users {
        id
        full_name
        email
        role
        full_name
        username
        pos_pin
        avatar_url
        phone
      }
      location {
        id
        name
        storesCount
      }
    }
  }
`;

export const GET_LOCATIONS = gql`
  query GetLocations {
    getLocations {
      id
      name
      address
      pin
      is_active
      created_at
      updated_at
      storesCount
    }
  }
`;

export const GET_UPLOAD_URL = gql`
  query GetUploadUrl($fileType: String!, $folder: String) {
    getUploadUrl(fileType: $fileType, folder: $folder) {
      url
      key
    }
  }
`;

export const GET_STORE_SESSION = gql`
  query GetStoreSessionById($id: String!) {
    getStoreSessionById(id: $id) {
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

export const GET_RECEIPTS = gql`
  query GetReceipts(
    $storeId: String!
    $pagination: PaginationInput!
    $filters: ReceiptFilterInput
  ) {
    getReceipts(storeId: $storeId, pagination: $pagination, filters: $filters) {
      data {
        id
        receipt_number
        items {
          product_id
          quantity
          unit_price
        }
        payment_methods {
          type
          amount
          card_type
          check_number
          last_four_digits
          reference
        }
        store {
          id
          name
        }
        employees {
          user {
            id
            full_name
            email
            username
          }
          split_share
        }
        customer {
          id
          first_name
          last_name
          email
          phone
          address_line_1
          address_line_2
          city
          state_province
          postal_code
          country
          loyalty_points
        }
        sub_total
        status
        discount_total
        tax_total
        grand_total
        notes
        created_at
        updated_at
      }
      count
    }
  }
`;

export const GET_RECEIPT_STATS = gql`
  query GetReceiptStats($storeId: String!) {
    getReceiptStats(storeId: $storeId) {
      totalCount
      totalCompleted
      totalSales
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getNotifications {
      id
      type
      title
      message
      data
      expires_at
      is_read
      user {
        id
        full_name
        email
        username
      }
      created_at
      updated_at
    }
  }
`;

export const GET_CUSTOMERS = gql`
  query GetCustomers($pagination: PaginationInput!, $search: String) {
    getCustomers(pagination: $pagination, search: $search) {
      data {
        id
        first_name
        last_name
        email
        phone
        address_line_1
        address_line_2
        city
        state_province
        postal_code
        country
        date_of_birth
        last_visit_date
        verification_date
        loyalty_points
        visit_count
        total_spent
        id_document_type
        id_document_path
        signature_path
        verified_by
        skin_type
        skin_concerns
        notes
        created_at
        updated_at
      }
      count
    }
  }
`;
