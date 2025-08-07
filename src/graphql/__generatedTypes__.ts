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
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  invitation_code: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  settings: Scalars['JSONObject']['output'];
  stores: Array<Store>;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  updated_at: Scalars['DateTime']['output'];
  users: Array<User>;
};

/** Business stats */
export type BusinessStats = {
  __typename?: 'BusinessStats';
  membersCount: Scalars['Float']['output'];
  productsCount: Scalars['Float']['output'];
  storeLocationsCount: Scalars['Float']['output'];
  storesCount: Scalars['Float']['output'];
};

export type CreateBusinessInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  ownerId?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
  subscription_plan?: InputMaybe<SubscriptionPlan>;
  subscription_status?: InputMaybe<SubscriptionStatus>;
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

export type CreateInventoryMovementInput = {
  /** User UUID who performs the movement */
  createdById: Scalars['ID']['input'];
  movement_type: MovementType;
  new_quantity?: InputMaybe<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  previous_quantity?: InputMaybe<Scalars['Int']['input']>;
  productId: Scalars['ID']['input'];
  quantity_change: Scalars['Int']['input'];
  reference_id?: InputMaybe<Scalars['String']['input']>;
  reference_type?: InputMaybe<ReferenceType>;
  storeId: Scalars['ID']['input'];
};

export type CreateProductCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
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
  /** Supplier UUID */
  supplierId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateReorderRequestInput = {
  inventoryId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
  restock_by: Scalars['DateTime']['input'];
};

export type CreateStoreInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_main?: InputMaybe<Scalars['Boolean']['input']>;
  /** Location UUID */
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  pin?: InputMaybe<Scalars['String']['input']>;
  tax_rate?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateStoreLocationInput = {
  address: Scalars['String']['input'];
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  lat?: InputMaybe<Scalars['String']['input']>;
  long?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  pin?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  contact_person?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<SupplierStatus>;
};

export type Inventory = {
  __typename?: 'Inventory';
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  is_low_stock: Scalars['Boolean']['output'];
  is_out_of_stock: Scalars['Boolean']['output'];
  is_overstocked: Scalars['Boolean']['output'];
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

export type InventoryFilterInput = {
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<InventoryStockStatus>;
};

export type InventoryMovement = {
  __typename?: 'InventoryMovement';
  created_at: Scalars['DateTime']['output'];
  created_by: User;
  id: Scalars['ID']['output'];
  movement_type: MovementType;
  new_quantity: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  previous_quantity: Scalars['Int']['output'];
  product: Product;
  quantity_change: Scalars['Int']['output'];
  reference_id?: Maybe<Scalars['String']['output']>;
  reference_type?: Maybe<ReferenceType>;
  store: Store;
  updated_at: Scalars['DateTime']['output'];
};

export type InventoryMovementPagination = {
  __typename?: 'InventoryMovementPagination';
  count: Scalars['Int']['output'];
  data: Array<InventoryMovement>;
};

export type InventoryPagination = {
  __typename?: 'InventoryPagination';
  count: Scalars['Int']['output'];
  data: Array<Inventory>;
};

/** Inventory stats */
export type InventoryStats = {
  __typename?: 'InventoryStats';
  lowStockItemsCount: Scalars['Float']['output'];
  outOfStockCount: Scalars['Float']['output'];
  productsCount: Scalars['Float']['output'];
  totalValue: Scalars['Float']['output'];
};

export enum InventoryStockStatus {
  InStock = 'IN_STOCK',
  LowStock = 'LOW_STOCK',
  OutOfStock = 'OUT_OF_STOCK',
  Overstocked = 'OVERSTOCKED'
}

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

export enum MovementType {
  Adjustment = 'ADJUSTMENT',
  Damage = 'DAMAGE',
  Purchase = 'PURCHASE',
  Receive = 'RECEIVE',
  Return = 'RETURN',
  Sale = 'SALE',
  TransferIn = 'TRANSFER_IN',
  TransferOut = 'TRANSFER_OUT'
}

export type Mutation = {
  __typename?: 'Mutation';
  createBusiness: Business;
  createInventory: Inventory;
  createInventoryAlert: InventoryAlert;
  createInventoryMovement: InventoryMovement;
  createLowStockAlert: LowStockAlert;
  createProduct: Scalars['Boolean']['output'];
  createProductCategory: ProductCategory;
  createReorderRequest: ReorderRequest;
  createStore: Store;
  createStoreLocation: StoreLocation;
  createStoreSession: StoreDaySession;
  createSupplier: Supplier;
  deleteInventory: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteProductCategory: Scalars['Boolean']['output'];
  deleteStore: Scalars['Boolean']['output'];
  deleteStoreLocation: Scalars['Boolean']['output'];
  deleteSupplier: Scalars['Boolean']['output'];
  loginBusinessOwner: LoginResponse;
  registerBusinessOwner: LoginResponse;
  reorderInventory: Scalars['Boolean']['output'];
  resendVerificationEmail: Scalars['Boolean']['output'];
  updateBusiness: Scalars['Boolean']['output'];
  updateInventory: Scalars['Boolean']['output'];
  updateInventoryAlert: Scalars['Boolean']['output'];
  updateInventoryMovement: Scalars['Boolean']['output'];
  updateLowStockAlert: Scalars['Boolean']['output'];
  updateProduct: Scalars['Boolean']['output'];
  updateProductCategory: Scalars['Boolean']['output'];
  updateReorderRequest: Scalars['Boolean']['output'];
  updateStore: Scalars['Boolean']['output'];
  updateStoreLocation: Scalars['Boolean']['output'];
  updateSupplier: Scalars['Boolean']['output'];
  verifyEmail: Scalars['Boolean']['output'];
};


export type MutationCreateBusinessArgs = {
  input: CreateBusinessInput;
};


export type MutationCreateInventoryArgs = {
  input: CreateInventoryInput;
};


export type MutationCreateInventoryAlertArgs = {
  input: InventoryAlertInput;
};


export type MutationCreateInventoryMovementArgs = {
  input: CreateInventoryMovementInput;
};


export type MutationCreateLowStockAlertArgs = {
  input: LowStockAlertInput;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
  inventory: CreateInventoryInput;
};


export type MutationCreateProductCategoryArgs = {
  input: CreateProductCategoryInput;
};


export type MutationCreateReorderRequestArgs = {
  input: CreateReorderRequestInput;
};


export type MutationCreateStoreArgs = {
  input: CreateStoreInput;
};


export type MutationCreateStoreLocationArgs = {
  input: CreateStoreLocationInput;
};


export type MutationCreateStoreSessionArgs = {
  input: StoreSessionInput;
};


export type MutationCreateSupplierArgs = {
  input: CreateSupplierInput;
};


export type MutationDeleteInventoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteProductCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteStoreArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteSupplierArgs = {
  id: Scalars['String']['input'];
};


export type MutationLoginBusinessOwnerArgs = {
  input: LoginInput;
};


export type MutationRegisterBusinessOwnerArgs = {
  input: RegisterInput;
};


export type MutationReorderInventoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateBusinessArgs = {
  input: UpdateBusinessInput;
};


export type MutationUpdateInventoryArgs = {
  input: UpdateInventoryInput;
};


export type MutationUpdateInventoryAlertArgs = {
  id: Scalars['String']['input'];
  input: InventoryAlertInput;
};


export type MutationUpdateInventoryMovementArgs = {
  input: UpdateInventoryMovementInput;
};


export type MutationUpdateLowStockAlertArgs = {
  id: Scalars['String']['input'];
  input: LowStockAlertInput;
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
  inventory?: InputMaybe<UpdateInventoryInput>;
};


export type MutationUpdateProductCategoryArgs = {
  input: UpdateProductCategoryInput;
};


export type MutationUpdateReorderRequestArgs = {
  input: UpdateReorderRequestInput;
};


export type MutationUpdateStoreArgs = {
  input: UpdateStoreInput;
};


export type MutationUpdateStoreLocationArgs = {
  input: UpdateStoreLocationInput;
};


export type MutationUpdateSupplierArgs = {
  input: UpdateSupplierInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Float']['input']>;
  take?: InputMaybe<Scalars['Float']['input']>;
};

export type Product = {
  __typename?: 'Product';
  barcode?: Maybe<Scalars['String']['output']>;
  business?: Maybe<Business>;
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
  supplier?: Maybe<Supplier>;
  updated_at: Scalars['DateTime']['output'];
};

export type ProductCategory = {
  __typename?: 'ProductCategory';
  business?: Maybe<Business>;
  created_at: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  products: Array<Product>;
  updated_at: Scalars['DateTime']['output'];
};

export type ProductPagination = {
  __typename?: 'ProductPagination';
  count: Scalars['Int']['output'];
  data: Array<Product>;
};

export type Query = {
  __typename?: 'Query';
  getBusinessStats: BusinessStats;
  getCategories: Array<ProductCategory>;
  getCurrentUser: User;
  getInventoryByBusiness: InventoryPagination;
  getInventoryStats: InventoryStats;
  getLocations: Array<StoreLocation>;
  getLowStockInventoryByBusiness: InventoryPagination;
  getMovementsByBusiness: InventoryMovementPagination;
  getProductsByBusiness: ProductPagination;
  getReorderRequestsByBusiness: ReorderRequestPagination;
  getStores: Array<Store>;
  getSuppliers: Array<Supplier>;
  getUploadUrl: SignedUrlResponse;
  sayHello: Scalars['String']['output'];
};


export type QueryGetBusinessStatsArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetInventoryByBusinessArgs = {
  filters?: InputMaybe<InventoryFilterInput>;
  pagination: PaginationInput;
};


export type QueryGetLowStockInventoryByBusinessArgs = {
  filters?: InputMaybe<InventoryFilterInput>;
  pagination: PaginationInput;
};


export type QueryGetMovementsByBusinessArgs = {
  pagination: PaginationInput;
};


export type QueryGetProductsByBusinessArgs = {
  pagination: PaginationInput;
};


export type QueryGetReorderRequestsByBusinessArgs = {
  pagination: PaginationInput;
};


export type QueryGetUploadUrlArgs = {
  fileType?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
};

export enum ReferenceType {
  Adjustment = 'ADJUSTMENT',
  Order = 'ORDER',
  PurchaseOrder = 'PURCHASE_ORDER',
  Return = 'RETURN',
  Transfer = 'TRANSFER'
}

export type RegisterInput = {
  business_name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  full_name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  pos_pin: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type ReorderRequest = {
  __typename?: 'ReorderRequest';
  created_at: Scalars['DateTime']['output'];
  created_by: User;
  id: Scalars['ID']['output'];
  inventory: Inventory;
  quantity: Scalars['Int']['output'];
  restock_by: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type ReorderRequestPagination = {
  __typename?: 'ReorderRequestPagination';
  count: Scalars['Int']['output'];
  data: Array<ReorderRequest>;
};

export enum SessionStatus {
  Closed = 'CLOSED',
  Open = 'OPEN'
}

export type SignedUrlResponse = {
  __typename?: 'SignedUrlResponse';
  key: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Store = {
  __typename?: 'Store';
  address?: Maybe<Scalars['String']['output']>;
  business: Business;
  created_at: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  is_main: Scalars['Boolean']['output'];
  location?: Maybe<StoreLocation>;
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  pin?: Maybe<Scalars['String']['output']>;
  tax_rate: Scalars['Float']['output'];
  updated_at: Scalars['DateTime']['output'];
  users: Array<User>;
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

export type StoreLocation = {
  __typename?: 'StoreLocation';
  address: Scalars['String']['output'];
  business?: Maybe<Business>;
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  is_active: Scalars['Boolean']['output'];
  lat?: Maybe<Scalars['String']['output']>;
  long?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pin?: Maybe<Scalars['String']['output']>;
  stores: Array<Store>;
  storesCount?: Maybe<Scalars['Float']['output']>;
  timezone: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
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

export enum SubscriptionPlan {
  Enterprise = 'ENTERPRISE',
  Professional = 'PROFESSIONAL',
  Starter = 'STARTER'
}

export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type Supplier = {
  __typename?: 'Supplier';
  address?: Maybe<Scalars['String']['output']>;
  business: Business;
  contact_person?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  status: SupplierStatus;
  updated_at: Scalars['DateTime']['output'];
};

export enum SupplierStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type UpdateBusinessInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** Business UUID to update */
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
  subscription_plan?: InputMaybe<SubscriptionPlan>;
  subscription_status?: InputMaybe<SubscriptionStatus>;
};

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

export type UpdateInventoryMovementInput = {
  /** User UUID who performs the movement */
  createdById?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  movement_type?: InputMaybe<MovementType>;
  new_quantity?: InputMaybe<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  previous_quantity?: InputMaybe<Scalars['Int']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  quantity_change?: InputMaybe<Scalars['Int']['input']>;
  reference_id?: InputMaybe<Scalars['String']['input']>;
  reference_type?: InputMaybe<ReferenceType>;
  storeId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateProductCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  /** Category UUID to update */
  id: Scalars['ID']['input'];
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
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
  /** Supplier UUID */
  supplierId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateReorderRequestInput = {
  id: Scalars['ID']['input'];
  inventoryId?: InputMaybe<Scalars['ID']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  restock_by?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateStoreInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** Store UUID to update */
  id: Scalars['ID']['input'];
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_main?: InputMaybe<Scalars['Boolean']['input']>;
  /** Location UUID */
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  pin?: InputMaybe<Scalars['String']['input']>;
  tax_rate?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateStoreLocationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  /** Location UUID to update */
  id: Scalars['ID']['input'];
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  lat?: InputMaybe<Scalars['String']['input']>;
  long?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pin?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  contact_person?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** Supplier UUID to update */
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<SupplierStatus>;
};

export type User = {
  __typename?: 'User';
  availability_preferences?: Maybe<Scalars['JSONObject']['output']>;
  avatar_url?: Maybe<Scalars['String']['output']>;
  business: Business;
  email: Scalars['String']['output'];
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  full_name: Scalars['String']['output'];
  hired_date: Scalars['String']['output'];
  hourly_rate?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isEmailVerified: Scalars['Boolean']['output'];
  is_active: Scalars['Boolean']['output'];
  performance_metrics?: Maybe<Scalars['JSONObject']['output']>;
  phone: Scalars['String']['output'];
  pos_pin: Scalars['String']['output'];
  position?: Maybe<Scalars['String']['output']>;
  position_type?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  specialties: Array<Scalars['String']['output']>;
  store: Store;
  username: Scalars['String']['output'];
};

export enum UserRole {
  BusinessOwner = 'BUSINESS_OWNER',
  Employee = 'EMPLOYEE',
  Manager = 'MANAGER',
  Office = 'OFFICE',
  Salesperson = 'SALESPERSON'
}
