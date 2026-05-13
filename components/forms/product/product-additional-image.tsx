import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { MultiImageDropzone } from '@/components/ui/image-dropzone';
import { X } from 'lucide-react';
import Image from 'next/image';

export default function ProductAdditionalImage({
  additionalImages,
  removeImage,
  onFilesAdded
}: {
  additionalImages: string[];
  removeImage: (index: number) => void;
  onFilesAdded: (files: File[]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Product Images</CardTitle>
        <CardDescription>
          Upload additional images to showcase your product from different
          angles or show product details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {additionalImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {additionalImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-md border bg-muted"
              >
                <Image
                  src={image || '/placeholder.svg'}
                  alt={`Additional product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            ))}
          </div>
        )}
        <MultiImageDropzone
          onFilesAdded={onFilesAdded}
          maxSize={2 * 1024 * 1024}
          hint="Recommended: 800×800px. Max 2 MB per image. Select multiple at once."
        />
      </CardContent>
    </Card>
  );
}
