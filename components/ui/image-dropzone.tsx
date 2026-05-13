'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  useDropzone,
  type DropzoneOptions,
  type FileRejection
} from 'react-dropzone';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// ─── Shared defaults (change here to affect all dropzones in the project) ─────

export const DROPZONE_ACCEPT_IMAGES: DropzoneOptions['accept'] = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
};

export const DROPZONE_DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Single-image dropzone ────────────────────────────────────────────────────

export interface ImageDropzoneProps {
  /** A File object (newly selected) or a URL string (existing image). */
  value?: File | string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number;
  hint?: string;
  className?: string;
  accept?: DropzoneOptions['accept'];
  objectFit?: 'cover' | 'contain';
}

export function ImageDropzone({
  value,
  onChange,
  disabled = false,
  maxSize = DROPZONE_DEFAULT_MAX_SIZE,
  hint,
  className,
  accept = DROPZONE_ACCEPT_IMAGES,
  objectFit = 'cover'
}: ImageDropzoneProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBlobUrl(null);
  }, [value]);

  const previewSrc =
    value instanceof File
      ? blobUrl
      : typeof value === 'string' && value
      ? value
      : null;

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        const code = rejected[0].errors[0].code;
        toast({
          title: 'Invalid file',
          description:
            code === 'file-too-large'
              ? `File must be under ${(maxSize / 1024 / 1024).toFixed(0)} MB.`
              : 'Only image files are accepted.',
          variant: 'destructive'
        });
        return;
      }
      if (accepted[0]) onChange(accepted[0]);
    },
    [onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
    multiple: false,
    noClick: true
  });

  if (previewSrc) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden rounded-md border',
          isDragActive && 'ring-2 ring-primary ring-offset-2',
          className
        )}
      >
        <input {...getInputProps()} />
        <Image
          src={previewSrc}
          alt="Upload preview"
          fill
          className={cn(
            'transition-opacity',
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          )}
        />
        {!disabled && (
          <>
            <button
              type="button"
              onClick={open}
              className="absolute inset-0 flex items-end justify-center bg-black/0 pb-3 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
              aria-label="Replace image"
            >
              <span className="rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium shadow">
                {isDragActive ? 'Drop to replace' : 'Click or drag to replace'}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      onClick={disabled ? undefined : open}
      className={cn(
        'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/60',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 h-8 w-8" />
      <p className="text-sm font-medium">
        {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
      </p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}

// ─── Multi-image dropzone ─────────────────────────────────────────────────────

export interface MultiImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  maxSize?: number;
  maxFiles?: number;
  hint?: string;
  className?: string;
  accept?: DropzoneOptions['accept'];
}

export function MultiImageDropzone({
  onFilesAdded,
  disabled = false,
  maxSize = DROPZONE_DEFAULT_MAX_SIZE,
  maxFiles,
  hint,
  className,
  accept = DROPZONE_ACCEPT_IMAGES
}: MultiImageDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        toast({
          title: 'Some files skipped',
          description: 'Only image files under the size limit are accepted.',
          variant: 'destructive'
        });
      }
      if (accepted.length > 0) onFilesAdded(accepted);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    ...(maxFiles !== undefined && { maxFiles }),
    disabled,
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/60',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 h-8 w-8" />
      <p className="text-sm font-medium">
        {isDragActive
          ? 'Drop images here'
          : 'Drag & drop or click to select images'}
      </p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}

// ─── Hook for programmatic / custom use ──────────────────────────────────────
//
// Use when the built-in components don't fit the UX (e.g. a trigger button
// that opens the file picker without a visible drop zone).

export function useImageDrop({
  onFile,
  maxSize = DROPZONE_DEFAULT_MAX_SIZE,
  disabled = false,
  accept = DROPZONE_ACCEPT_IMAGES
}: {
  onFile: (file: File) => void;
  maxSize?: number;
  disabled?: boolean;
  accept?: DropzoneOptions['accept'];
}) {
  const onDropAccepted = useCallback(
    ([file]: File[]) => {
      if (file) onFile(file);
    },
    [onFile]
  );

  const onDropRejected = useCallback(
    (rejected: FileRejection[]) => {
      const code = rejected[0]?.errors[0]?.code;
      toast({
        title: 'Invalid file',
        description:
          code === 'file-too-large'
            ? `File must be under ${(maxSize / 1024 / 1024).toFixed(0)} MB.`
            : 'Only image files are accepted.',
        variant: 'destructive'
      });
    },
    [maxSize]
  );

  return useDropzone({
    onDropAccepted,
    onDropRejected,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
    multiple: false
  });
}
