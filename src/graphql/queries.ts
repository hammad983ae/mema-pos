import { gql } from "@apollo/client";

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      email
      emailVerificationToken
      isEmailVerified
      full_name
      username
      avatar_url
      phone
      position
      position_type
      specialties
      availability_preferences
      performance_metrics
    }
  }
`;

export const GET_CURRENT_MEMBERSHIPS = gql`
  query GetCurrentMemberships {
    getCurrentMemberships {
      id
      business {
        id
        name
      }
      role
      is_active
      hired_date
      hourly_rate
      created_at
      updated_at
    }
  }
`;
