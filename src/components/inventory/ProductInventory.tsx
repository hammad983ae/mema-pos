import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit, Trash2, Package, HelpCircle, Plus } from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  DELETE_PRODUCT,
  GET_INVENTORY_STATS,
  GET_PRODUCTS,
  Mutation,
  MutationDeleteProductArgs,
  Product,
  Query,
  QueryGetProductsByBusinessArgs,
} from "@/graphql";
import Pagination from "@/components/ui/pagination.tsx";
import { ProductInventoryForm } from "@/components/inventory/ProductInventoryForm.tsx";
import { DeleteProductDialog } from "@/components/inventory/DeleteProductDialog.tsx";

interface ProductInventoryProps {
  searchQuery: string;
  selectedStore: string;
}

export const ProductInventory = ({ selectedStore }: ProductInventoryProps) => {
  // const [sortBy, setSortBy] = useState("name");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState<number>(1);
  const { data, refetch } = useQuery<Query, QueryGetProductsByBusinessArgs>(
    GET_PRODUCTS,
    { variables: { pagination: { page, take: 10 } } },
  );

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowAddProduct(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Inventory</span>
          </CardTitle>
          {/*<div className="flex items-center space-x-3">*/}
          {/*  <Select value={sortBy} onValueChange={setSortBy}>*/}
          {/*    <SelectTrigger className="w-40">*/}
          {/*      <SelectValue placeholder="Sort by" />*/}
          {/*    </SelectTrigger>*/}
          {/*    <SelectContent>*/}
          {/*      <SelectItem value="name">Name</SelectItem>*/}
          {/*      <SelectItem value="price">Price</SelectItem>*/}
          {/*      <SelectItem value="price">Created at</SelectItem>*/}
          {/*    </SelectContent>*/}
          {/*  </Select>*/}
          {/*</div>*/}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <span>SPM</span>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Sales Person Minimum - Sets the minimum price
                          employees can sell this product for
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.getProductsByBusiness?.data?.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  refetch={refetch}
                  handleEdit={handleEditProduct}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <Pagination
            count={data?.getProductsByBusiness?.count}
            page={page}
            setPage={setPage}
          />

          <div className="flex items-center space-x-3">
            <Button size="sm" onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </div>
        </div>

        {showAddProduct && (
          <ProductInventoryForm
            isProductForm={!!selectedProduct}
            refetch={refetch}
            handleClose={() => {
              setShowAddProduct(false);
              setSelectedProduct(null);
            }}
            item={selectedProduct}
          />
        )}
      </CardContent>
    </Card>
  );
};

const ProductItem = ({
  product,
  refetch,
  handleEdit,
}: {
  product: Product;
  refetch: () => void;
  handleEdit: (product: Product) => void;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteProduct, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteProductArgs
  >(DELETE_PRODUCT);

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center space-x-3">
          <span>{product.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
      <TableCell>${product.price}</TableCell>
      <TableCell className="text-muted-foreground">${product.cost}</TableCell>
      <TableCell className="text-primary font-medium">
        ${product.minimum_price}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {product.supplier?.name ?? "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            loading={deleting}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>

      {showDeleteDialog && (
        <DeleteProductDialog
          item={product}
          handleDelete={() => {
            deleteProduct({
              variables: { id: product.id },
              refetchQueries: [{ query: GET_INVENTORY_STATS }],
            }).then(() => {
              setShowDeleteDialog(false);
              refetch();
            });
          }}
          handleClose={() => setShowDeleteDialog(false)}
        />
      )}
    </TableRow>
  );
};
