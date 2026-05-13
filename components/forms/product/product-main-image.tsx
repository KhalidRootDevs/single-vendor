import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ImageDropzone } from '@/components/ui/image-dropzone';

export default function ProductMainImage({
  mainImage,
  setMainImage,
  setAvailableImages,
  setImageFiles
}: {
  mainImage: string;
  setMainImage: (s: string) => void;
  setAvailableImages: any;
  setImageFiles: any;
}) {
  const handleChange = (file: File | null) => {
    if (file) {
      setImageFiles((prev: any) => [...prev, file]);
      const url = URL.createObjectURL(file);
      setMainImage(url);
      setAvailableImages((prev: any) => {
        const next = [...prev];
        next[0] = url;
        return next;
      });
    } else {
      setMainImage('');
      setAvailableImages((prev: any) => prev.slice(1));
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
      <CardContent>
        <ImageDropzone
          value={mainImage || null}
          onChange={handleChange}
          hint="Recommended: 1000×1000px. Max 2 MB."
          maxSize={2 * 1024 * 1024}
          className="mx-auto aspect-square max-w-md"
        />
      </CardContent>
    </Card>
  );
}
