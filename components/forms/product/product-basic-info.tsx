import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";

export default function ProductBasicInfo({
  isLoadingCategories,
  categories,
  tags,
}: {
  isLoadingCategories: boolean;
  categories: any;
  tags: any;
}) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Enter the basic details of your product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Premium T-Shirt"
              {...register("name")}
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.name && (
              <div className="flex gap-2 items-start">
                <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
                <p className="text-sm text-red-500">
                  {errors?.name?.message as string}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("categoryId")}
              onValueChange={(value) => setValue("categoryId", value)}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                <SelectValue
                  placeholder={
                    isLoadingCategories
                      ? "Loading categories..."
                      : "Select a category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat: any) => !cat.parentId)
                  .map((parentCategory: any) => (
                    <React.Fragment key={parentCategory._id}>
                      <SelectItem value={parentCategory._id}>
                        {parentCategory.name}
                      </SelectItem>
                      {categories
                        .filter(
                          (cat: any) =>
                            cat.parentId &&
                            (typeof cat.parentId === "string"
                              ? cat.parentId === parentCategory._id
                              : cat.parentId._id === parentCategory._id)
                        )
                        .map((subCategory: any) => (
                          <SelectItem
                            key={subCategory._id}
                            value={subCategory._id}
                          >
                            <span className="ml-4">└─ {subCategory.name}</span>
                          </SelectItem>
                        ))}
                    </React.Fragment>
                  ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <div className="flex gap-2 items-start">
                <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
                <p className="text-sm text-red-500">
                  {errors.categoryId.message as string}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your product..."
            rows={5}
            {...register("description")}
            className={errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.description && (
            <div className="flex gap-2 items-start">
              <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
              <p className="text-sm text-red-500">
                {errors.description.message as string}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                className={`pl-7 ${errors.price ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                placeholder="0.00"
                {...register("price")}
              />
            </div>
            {errors.price && (
              <div className="flex gap-2 items-start">
                <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
                <p className="text-sm text-red-500">
                  {errors.price.message as string}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare-at Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                {...register("compareAtPrice")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost per Item</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="cost"
                type="number"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                {...register("cost")}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input
              id="sku"
              placeholder="e.g., TSHIRT-BLK-M"
              {...register("sku")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (ISBN, UPC, GTIN, etc.)</Label>
            <Input
              id="barcode"
              placeholder="e.g., 123456789012"
              {...register("barcode")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              placeholder="e.g., Nike, Apple, etc."
              {...register("brand")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">
              Inventory <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stock"
              type="number"
              placeholder="0"
              {...register("stock")}
              className={errors.stock ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.stock && (
              <div className="flex gap-2 items-start">
                <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
                <p className="text-sm text-red-500">
                  {errors.stock.message as string}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tags.map((tag: any) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={watch("tags")?.includes(tag.id) || false}
                  onCheckedChange={(checked) => {
                    const currentTags = watch("tags") || [];
                    if (checked) {
                      setValue("tags", [...currentTags, tag.id]);
                    } else {
                      setValue(
                        "tags",
                        currentTags.filter((t: any) => t !== tag.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                  {tag.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Make this product visible to customers.
            </p>
          </div>
          <Switch
            id="active"
            checked={watch("active")}
            onCheckedChange={(checked) => setValue("active", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="featured">Featured</Label>
            <p className="text-sm text-muted-foreground">
              Show this product as featured.
            </p>
          </div>
          <Switch
            id="featured"
            checked={watch("featured")}
            onCheckedChange={(checked) => setValue("featured", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
