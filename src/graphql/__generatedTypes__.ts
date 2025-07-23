export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSONObject: { input: any; output: any; }
};

export type Business = {
  __typename?: 'Business';
  address?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  invitation_code: Scalars['String']['output'];
  memberships: Array<UserBusinessMembership>;
  name: Scalars['String']['output'];
  owner: User;
  settings: Scalars['JSONObject']['output'];
  subscription_plan: Scalars['String']['output'];
  subscription_status: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  access_token: Scalars['String']['output'];
  user: User;
};

export type Mutation = {
  __typename?: 'Mutation';
  login: LoginResponse;
  register: LoginResponse;
  verifyEmail: Scalars['Boolean']['output'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  getCurrentMemberships: Array<UserBusinessMembership>;
  getCurrentUser: User;
  sayHello: Scalars['String']['output'];
};

export type RegisterInput = {
  business_name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  full_name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  pos_pin: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  availability_preferences?: Maybe<Scalars['JSONObject']['output']>;
  avatar_url?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  full_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isEmailVerified: Scalars['Boolean']['output'];
  performance_metrics?: Maybe<Scalars['JSONObject']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['String']['output']>;
  position_type?: Maybe<Scalars['String']['output']>;
  specialties: Array<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserBusinessMembership = {
  __typename?: 'UserBusinessMembership';
  business: Business;
  created_at: Scalars['DateTime']['output'];
  hired_date: Scalars['String']['output'];
  hourly_rate?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  role: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
  user: User;
};
