import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";
import { useMutation } from "@apollo/client";
import { CREATE_PRODUCT, Mutation, MutationCreateProductArgs } from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

type Props = {
  refetch: () => void;
  handleClose: () => void;
};

export const AddProductForm = ({ refetch, handleClose }: Props) => {
  const [createProduct, { loading: creatingProduct }] = useMutation<
    Mutation,
    MutationCreateProductArgs
  >(CREATE_PRODUCT);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost: "",
    minimumPrice: "",
    description: "",
    image_url: "",
    low_stock_threshold: "10",
    max_stock_level: "",
    initial_quantity: "0",
  });

  const handleAddProduct = () => {
    const {
      name,
      sku,
      barcode,
      price,
      cost,
      minimum_price,
      description,
      max_stock_level,
      initial_quantity,
      low_stock_threshold,
    } = productForm;

    createProduct({
      variables: {
        input: {
          name,
          sku,
          barcode,
          price: parseFloat(price),
          cost: parseFloat(cost),
          minimum_price,
          description,
          is_active: true,
        },
        inventory: {
          quantity_on_hand: parseInt(initial_quantity),
          low_stock_threshold: parseInt(low_stock_threshold),
          max_stock_level: parseInt(max_stock_level),
        },
      },
    }).then(() => {
      showSuccess("Product added successfully");

      refetch();

      setProductForm({
        name: "",
        sku: "",
        barcode: "",
        price: "",
        cost: "",
        minimumPrice: "",
        description: "",
        image_url: "",
        low_stock_threshold: "10",
        max_stock_level: "",
        initial_quantity: "0",
      });

      handleClose();
    });
  };

  return (
    <Dialog onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Product SKU"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.cost}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    cost: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="minimumPrice"
                tooltip="Sales Person Minimum - Sets the minimum price employees can sell this product for"
                required
              >
                SPM ($)
              </LabelWithTooltip>
              <Input
                id="minimumPrice"
                type="number"
                step="0.01"
                value={productForm.minimumPrice}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    minimumPrice: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Initial Quantity</Label>
              <Input
                type="number"
                value={productForm.initial_quantity}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    initial_quantity: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                value={productForm.low_stock_threshold}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    low_stock_threshold: e.target.value,
                  }))
                }
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stock Level</Label>
              <Input
                type="number"
                value={productForm.max_stock_level}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    max_stock_level: e.target.value,
                  }))
                }
                placeholder="100"
              />
            </div>
          </div>

          <ImageUpload
            value={productForm.image_url}
            onChange={(url) =>
              setProductForm((prev) => ({ ...prev, image_url: url || "" }))
            }
            bucket="product-images"
            path="products/"
          />

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={productForm.description}
              onChange={(e) =>
                setProductForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} loading={creatingProduct}>
              Add Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
