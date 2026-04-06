import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ProductMainImage({
  mainImage,
  setMainImage,
  setAvailableImages,
  setImageFiles,
  isEditing = false,
  existingImages = [],
  imagesToDelete = [],
}: {
  mainImage: string;
  setMainImage: (s: string) => void;
  setAvailableImages: any;
  setImageFiles: any;
  isEditing?: boolean;
  existingImages?: string[];
  imagesToDelete?: string[];
}) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  const isExistingImage = existingImages.includes(mainImage);
  const isMarkedForDelete = imagesToDelete.includes(mainImage);

  const removeMainImage = () => {
    setMainImage("");
    setAvailableImages((prev: any) => prev.slice(1));
    setValidationError("");
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      setValidationError("Please upload an image file (JPG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError("Image must be smaller than 5MB");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setImageFiles((prev: any) => [...prev, file]);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setMainImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setImageFiles((prev: any) => [...prev, file]);

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setMainImage(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Product Image</CardTitle>
        <CardDescription>
          Upload the primary image for your product. This will be the featured
          image displayed in listings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mainImage ? (
          <div className="relative border rounded-lg aspect-square max-w-md mx-auto overflow-hidden bg-muted">
            <Image
              src={mainImage || "/placeholder.svg"}
              alt="Main product image"
              fill
              className={`object-cover ${isMarkedForDelete ? "opacity-50" : ""}`}
            />
            {isExistingImage && isMarkedForDelete && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <p className="text-white text-sm font-medium">Marked for deletion</p>
              </div>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={removeMainImage}
              type="button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove main image</span>
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg aspect-square max-w-md mx-auto flex flex-col items-center justify-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">Drag image here or click to browse</p>
            <p className="text-xs mt-1">JPG, PNG, GIF or WebP up to 5MB</p>
          </div>
        )}
        
        {validationError && (
          <div className="flex gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{validationError}</p>
          </div>
        )}

        <div className="max-w-md mx-auto">
          <Label htmlFor="mainImage" className="mb-2 block">
            {mainImage ? "Replace Main Image" : "Upload Main Image"}
          </Label>
          <Input
            id="mainImage"
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Recommended size: 1000x1000px. Max file size: 5MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
