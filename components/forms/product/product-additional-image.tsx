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
import { Upload, X, AlertCircle, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ProductAdditionalImage({
  additionalImages,
  removeImage,
  restoreImage,
  handleAdditionalImagesChange,
  imagesToDelete = [],
  existingImages = [],
}: any) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      setValidationError("Please upload image files only (JPG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError("Each image must be smaller than 5MB");
      return false;
    }

    setValidationError("");
    return true;
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
      const validFiles = Array.from(files).filter((file) => validateFile(file));
      if (validFiles.length > 0) {
        // Create a synthetic event for the change handler
        const input = document.getElementById("images") as HTMLInputElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          validFiles.forEach((file) => dataTransfer.items.add(file));
          input.files = dataTransfer.files;
          
          const event = new Event("change", { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter((file) => validateFile(file));
      if (validFiles.length > 0) {
        handleAdditionalImagesChange({
          target: { files: validFiles },
        } as any);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Product Images</CardTitle>
        <CardDescription>
          Upload additional images to showcase your product from different
          angles or show product details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {additionalImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {additionalImages.length} image{additionalImages.length !== 1 ? "s" : ""} added
              </p>
              {imagesToDelete.length > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  {imagesToDelete.length} marked for deletion
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {additionalImages.map((image: any, index: number) => {
                const isExisting = existingImages.includes(image);
                const isMarkedForDelete = imagesToDelete.includes(image);
                return (
                  <div
                    key={index}
                    className={`relative border rounded-md aspect-square overflow-hidden group ${
                      isMarkedForDelete ? "bg-red-50 border-red-200" : "bg-muted"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Additional product image ${index + 1}`}
                      fill
                      className={`object-cover ${isMarkedForDelete ? "opacity-50" : ""}`}
                    />
                    {isMarkedForDelete && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <p className="text-white text-xs font-medium">Marked for deletion</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isExisting && isMarkedForDelete ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => restoreImage(image)}
                          type="button"
                          className="h-8"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeImage(index, image)}
                          type="button"
                          title={isExisting ? "This will delete the image when saved" : "Remove this image"}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">
                            {isExisting ? "Delete" : "Remove"} image
                          </span>
                        </Button>
                      )}
                    </div>
                    {isExisting && (
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Existing
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Label htmlFor="images" className="block">
            {additionalImages.length > 0 ? "Add More Images" : "Upload Additional Images"}
          </Label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 w-full flex flex-col items-center justify-center transition-colors cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium text-center">
              Drag images here or click to browse
            </p>
            <p className="text-xs mt-1 text-center">
              JPG, PNG, GIF or WebP • Up to 5MB each • Multiple files supported
            </p>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => document.getElementById("images")?.click()}
              type="button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Images
            </Button>
          </div>

          {validationError && (
            <div className="flex gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Recommended size: 800x800px. You can add multiple images at once.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
