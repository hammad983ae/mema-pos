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
