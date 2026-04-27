'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, Upload, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ImageFile = File & { preview: string };

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] };

// ─── Sortable item ────────────────────────────────────────────────────────────

interface SortableItemProps {
  file: ImageFile;
  index: number;
  onRemove: (i: number) => void;
}

function SortableItem({ file, index, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: file.preview });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted',
        index === 0 ? 'border-primary' : 'border-border',
        isDragging && 'z-50 opacity-50'
      )}
    >
      {index === 0 && (
        <div className="absolute left-1 top-1 z-10">
          <Badge className="flex h-5 items-center gap-1 px-1.5 py-0 text-[10px]">
            <Star className="h-2.5 w-2.5" />
            Main
          </Badge>
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-1 top-1 z-10 cursor-grab rounded bg-black/60 p-0.5 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5 text-white" />
      </div>

      <img
        src={file.preview}
        alt={`Product image ${index + 1}`}
        className="h-full w-full object-cover"
      />

      {/* Filename overlay */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 px-1.5 py-1 transition-transform group-hover:translate-y-0">
        <p className="truncate text-[10px] text-white">{file.name}</p>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute bottom-1 right-1 z-10 rounded-full bg-destructive p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProductImageUploadProps {
  name: string;
  disabled?: boolean;
}

export function ProductImageUpload({
  name,
  disabled = false
}: ProductImageUploadProps) {
  const {
    watch,
    setValue,
    formState: { isSubmitting }
  } = useFormContext();

  const isDisabled = disabled || isSubmitting;
  const files: ImageFile[] = watch(name) ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      if (rejected.length > 0) {
        const sizeErr = rejected.some((r) =>
          r.errors.some((e: { code: string }) => e.code === 'file-too-large')
        );
        toast.error(
          sizeErr ? 'File exceeds 5 MB limit.' : 'Invalid file type.'
        );
        return;
      }
      const next: ImageFile[] = accepted.map((f) =>
        Object.assign(f, { preview: URL.createObjectURL(f) })
      );
      setValue(name, [...files, ...next], {
        shouldValidate: true,
        shouldDirty: true
      });
    },
    [files, name, setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    onDrop,
    disabled: isDisabled,
    multiple: true
  });

  const handleRemove = (index: number) => {
    const next = [...files];
    URL.revokeObjectURL(next[index].preview);
    next.splice(index, 1);
    setValue(name, next, { shouldValidate: true, shouldDirty: true });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = files.findIndex((f) => f.preview === active.id);
    const to = files.findIndex((f) => f.preview === over.id);
    setValue(name, arrayMove(files, from, to), { shouldDirty: true });
  };

  // Revoke all previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/60 hover:bg-muted/30',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive
              ? 'Drop images here'
              : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP — max 5 MB each
          </p>
        </div>
      </div>

      {/* Sortable image grid */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} image{files.length !== 1 ? 's' : ''} · drag to
              reorder · first image is main
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                files.forEach((f) => URL.revokeObjectURL(f.preview));
                setValue(name, [], {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            >
              Clear all
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.preview)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {files.map((file, index) => (
                  <SortableItem
                    key={file.preview}
                    file={file}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
