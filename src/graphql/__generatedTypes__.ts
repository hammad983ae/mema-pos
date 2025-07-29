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

export enum AlertLevel {
  Critical = 'CRITICAL',
  Low = 'LOW'
}

export type Business = {
  __typename?: 'Business';
  address?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  invitation_code: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  settings: Scalars['JSONObject']['output'];
  stores: Array<Store>;
  subscription_plan: Scalars['String']['output'];
  subscription_status: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
  users: Array<User>;
};

export type BusinessInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
  subscription_plan?: InputMaybe<SubscriptionPlan>;
  subscription_status?: InputMaybe<SubscriptionStatus>;
};

/** Business stats */
export type BusinessStats = {
  __typename?: 'BusinessStats';
  membersCount: Scalars['Float']['output'];
  productsCount: Scalars['Float']['output'];
  storesCount: Scalars['Float']['output'];
};

export type CreateInventoryInput = {
  /** Count timestamp (defaults to now) */
  last_counted_at?: InputMaybe<Scalars['DateTime']['input']>;
  low_stock_threshold?: Scalars['Int']['input'];
  max_stock_level?: Scalars['Int']['input'];
  /** Product UUID */
  productId?: InputMaybe<Scalars['ID']['input']>;
  quantity_on_hand?: Scalars['Int']['input'];
  quantity_reserved?: Scalars['Int']['input'];
  reorder_point?: Scalars['Int']['input'];
  reorder_quantity?: Scalars['Int']['input'];
  /** Store UUID */
  storeId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  /** Category UUID */
  categoryId?: InputMaybe<Scalars['ID']['input']>;
  cost?: Scalars['Float']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  minimum_price?: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  price?: Scalars['Float']['input'];
  sku: Scalars['String']['input'];
};

export type Inventory = {
  __typename?: 'Inventory';
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  last_counted_at: Scalars['DateTime']['output'];
  low_stock_threshold: Scalars['Float']['output'];
  max_stock_level: Scalars['Float']['output'];
  product: Product;
  quantity_available: Scalars['Float']['output'];
  quantity_on_hand: Scalars['Float']['output'];
  quantity_reserved: Scalars['Float']['output'];
  reorder_point: Scalars['Float']['output'];
  reorder_quantity: Scalars['Float']['output'];
  store: Store;
  updated_at: Scalars['DateTime']['output'];
};

export type InventoryAlert = {
  __typename?: 'InventoryAlert';
  alert_type: InventoryAlertType;
  created_at: Scalars['DateTime']['output'];
  current_quantity: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  is_resolved: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  product: Product;
  resolved_at?: Maybe<Scalars['DateTime']['output']>;
  resolved_by?: Maybe<User>;
  store: Store;
  threshold_quantity: Scalars['Float']['output'];
};

export type InventoryAlertInput = {
  message?: InputMaybe<Scalars['String']['input']>;
};

export enum InventoryAlertType {
  LowStock = 'LOW_STOCK',
  OutOfStock = 'OUT_OF_STOCK',
  Overstocked = 'OVERSTOCKED',
  ReorderPoint = 'REORDER_POINT'
}

/** Inventory stats */
export type InventoryStats = {
  __typename?: 'InventoryStats';
  lowStockItemsCount: Scalars['Float']['output'];
  outOfStockCount: Scalars['Float']['output'];
  productsCount: Scalars['Float']['output'];
  totalValue: Scalars['Float']['output'];
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

export type LowStockAlert = {
  __typename?: 'LowStockAlert';
  alert_level: AlertLevel;
  created_at: Scalars['DateTime']['output'];
  current_stock: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  min_stock: Scalars['Float']['output'];
  product: Product;
  product_name: Scalars['String']['output'];
  resolved: Scalars['Boolean']['output'];
};

export type LowStockAlertInput = {
  min_stock?: InputMaybe<Scalars['Float']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createBusiness: Business;
  createInventory: Inventory;
  createInventoryAlert: InventoryAlert;
  createLowStockAlert: LowStockAlert;
  createProduct: Scalars['Boolean']['output'];
  createProductCategory: ProductCategory;
  createStore: Store;
  createStoreSession: StoreDaySession;
  loginBusinessOwner: LoginResponse;
  registerBusinessOwner: LoginResponse;
  updateBusiness: Scalars['Boolean']['output'];
  updateInventory: Scalars['Boolean']['output'];
  updateInventoryAlert: Scalars['Boolean']['output'];
  updateLowStockAlert: Scalars['Boolean']['output'];
  updateProduct: Scalars['Boolean']['output'];
  updateProductCategory: Scalars['Boolean']['output'];
  updateStore: Scalars['Boolean']['output'];
  verifyEmail: Scalars['Boolean']['output'];
};


export type MutationCreateBusinessArgs = {
  input: BusinessInput;
};


export type MutationCreateInventoryArgs = {
  input: CreateInventoryInput;
};


export type MutationCreateInventoryAlertArgs = {
  input: InventoryAlertInput;
};


export type MutationCreateLowStockAlertArgs = {
  input: LowStockAlertInput;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
  inventory: CreateInventoryInput;
};


export type MutationCreateProductCategoryArgs = {
  input: ProductCategoryInput;
};


export type MutationCreateStoreArgs = {
  input: StoreInput;
};


export type MutationCreateStoreSessionArgs = {
  input: StoreSessionInput;
};


export type MutationLoginBusinessOwnerArgs = {
  input: LoginInput;
};


export type MutationRegisterBusinessOwnerArgs = {
  input: RegisterInput;
};


export type MutationUpdateBusinessArgs = {
  id: Scalars['String']['input'];
  input: BusinessInput;
};


export type MutationUpdateInventoryArgs = {
  id: Scalars['String']['input'];
  input: UpdateInventoryInput;
};


export type MutationUpdateInventoryAlertArgs = {
  id: Scalars['String']['input'];
  input: InventoryAlertInput;
};


export type MutationUpdateLowStockAlertArgs = {
  id: Scalars['String']['input'];
  input: LowStockAlertInput;
};


export type MutationUpdateProductArgs = {
  id: Scalars['String']['input'];
  input: UpdateProductInput;
};


export type MutationUpdateProductCategoryArgs = {
  id: Scalars['String']['input'];
  input: ProductCategoryInput;
};


export type MutationUpdateStoreArgs = {
  id: Scalars['String']['input'];
  input: StoreInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export type Product = {
  __typename?: 'Product';
  barcode?: Maybe<Scalars['String']['output']>;
  category?: Maybe<ProductCategory>;
  cost: Scalars['Float']['output'];
  created_at: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image_url?: Maybe<Scalars['String']['output']>;
  is_active: Scalars['Boolean']['output'];
  minimum_price: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  sku: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type ProductCategory = {
  __typename?: 'ProductCategory';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  products: Array<Product>;
};

export type ProductCategoryInput = {
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  getBusinessStats: BusinessStats;
  getCurrentUser: User;
  getInventoryByBusiness: Array<Inventory>;
  getInventoryStats: InventoryStats;
  sayHello: Scalars['String']['output'];
};


export type QueryGetBusinessStatsArgs = {
  id: Scalars['String']['input'];
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

export enum SessionStatus {
  Closed = 'CLOSED',
  Open = 'OPEN'
}

export type Store = {
  __typename?: 'Store';
  address?: Maybe<Scalars['String']['output']>;
  business: Business;
  created_at: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  status: StoreStatus;
  tax_rate: Scalars['Float']['output'];
  timezone: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type StoreDaySession = {
  __typename?: 'StoreDaySession';
  cash_variance?: Maybe<Scalars['Float']['output']>;
  closed_at?: Maybe<Scalars['DateTime']['output']>;
  closed_by?: Maybe<User>;
  closing_cash_amount?: Maybe<Scalars['Float']['output']>;
  created_at: Scalars['DateTime']['output'];
  expected_cash_amount?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  opened_at: Scalars['DateTime']['output'];
  opened_by: User;
  opening_cash_amount: Scalars['Float']['output'];
  session_date: Scalars['DateTime']['output'];
  status: SessionStatus;
  store: Store;
  total_sales: Scalars['Float']['output'];
  total_transactions: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type StoreInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  businessId?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<StoreStatus>;
  tax_rate?: InputMaybe<Scalars['Float']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type StoreSessionInput = {
  cash_variance?: InputMaybe<Scalars['Float']['input']>;
  closing_cash_amount?: InputMaybe<Scalars['Float']['input']>;
  expected_cash_amount?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  opening_cash_amount?: Scalars['Float']['input'];
  session_date: Scalars['DateTime']['input'];
  status?: InputMaybe<SessionStatus>;
  storeId: Scalars['ID']['input'];
  total_sales?: Scalars['Float']['input'];
};

export enum StoreStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export enum SubscriptionPlan {
  Starter = 'STARTER'
}

export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type UpdateInventoryInput = {
  /** Inventory UUID to update */
  id: Scalars['ID']['input'];
  /** Count timestamp (defaults to now) */
  last_counted_at?: InputMaybe<Scalars['DateTime']['input']>;
  low_stock_threshold?: InputMaybe<Scalars['Int']['input']>;
  max_stock_level?: InputMaybe<Scalars['Int']['input']>;
  /** Product UUID */
  productId?: InputMaybe<Scalars['ID']['input']>;
  quantity_on_hand?: InputMaybe<Scalars['Int']['input']>;
  quantity_reserved?: InputMaybe<Scalars['Int']['input']>;
  reorder_point?: InputMaybe<Scalars['Int']['input']>;
  reorder_quantity?: InputMaybe<Scalars['Int']['input']>;
  /** Store UUID */
  storeId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars['String']['input']>;
  /** Category UUID */
  categoryId?: InputMaybe<Scalars['ID']['input']>;
  cost?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Product UUID to update */
  id: Scalars['ID']['input'];
  image_url?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  minimum_price?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  availability_preferences?: Maybe<Scalars['JSONObject']['output']>;
  avatar_url?: Maybe<Scalars['String']['output']>;
  business: Business;
  email: Scalars['String']['output'];
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  full_name?: Maybe<Scalars['String']['output']>;
  hired_date: Scalars['String']['output'];
  hourly_rate?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isEmailVerified: Scalars['Boolean']['output'];
  is_active: Scalars['Boolean']['output'];
  performance_metrics?: Maybe<Scalars['JSONObject']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['String']['output']>;
  position_type?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  specialties: Array<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export enum UserRole {
  BusinessOwner = 'BUSINESS_OWNER',
  Employee = 'EMPLOYEE',
  Manager = 'MANAGER',
  Office = 'OFFICE',
  Salesperson = 'SALESPERSON'
}
