import type { ImageCropRect } from '@/modules/create/domain/color-map/texture-crop';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import {
  centerSquareCrop,
  clampImageCropRect,
  cropRectFromCorners,
  fullImageCrop,
} from '@/modules/create/domain/color-map/texture-crop';

interface TexturePrepCropEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  busy: boolean;
  onApply: (crop: ImageCropRect) => void;
  onCancel: () => void;
}

interface ImageLayout {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
}

function containLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): ImageLayout {
  if (
    containerWidth <= 0
    || containerHeight <= 0
    || imageWidth <= 0
    || imageHeight <= 0
  ) {
    return { offsetX: 0, offsetY: 0, drawWidth: 0, drawHeight: 0 };
  }
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  return {
    offsetX: (containerWidth - drawWidth) / 2,
    offsetY: (containerHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
}

function clientToImage(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  layout: ImageLayout,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } | null {
  if (layout.drawWidth <= 0 || layout.drawHeight <= 0) {
    return null;
  }
  const localX = clientX - bounds.left - layout.offsetX;
  const localY = clientY - bounds.top - layout.offsetY;
  const x = (localX / layout.drawWidth) * imageWidth;
  const y = (localY / layout.drawHeight) * imageHeight;
  return {
    x: Math.min(Math.max(x, 0), imageWidth),
    y: Math.min(Math.max(y, 0), imageHeight),
  };
}

/**
 * 2D crop editor — drag on the image to choose the cut region, then Apply crop.
 */
export function TexturePrepCropEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  busy,
  onApply,
  onCancel,
}: TexturePrepCropEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ImageLayout>({
    offsetX: 0,
    offsetY: 0,
    drawWidth: 0,
    drawHeight: 0,
  });
  const [crop, setCrop] = useState<ImageCropRect>(() =>
    fullImageCrop(imageWidth, imageHeight),
  );
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setCrop(fullImageCrop(imageWidth, imageHeight));
  }, [imageWidth, imageHeight, imageUrl]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const update = () => {
      const { width, height } = stage.getBoundingClientRect();
      setLayout(containLayout(width, height, imageWidth, imageHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => {
      observer.disconnect();
    };
  }, [imageWidth, imageHeight]);

  const scaleX = imageWidth > 0 ? layout.drawWidth / imageWidth : 0;
  const scaleY = imageHeight > 0 ? layout.drawHeight / imageHeight : 0;
  const selectionStyle = {
    left: layout.offsetX + crop.sx * scaleX,
    top: layout.offsetY + crop.sy * scaleY,
    width: crop.sw * scaleX,
    height: crop.sh * scaleY,
  };

  const beginDrag = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage || busy) {
      return;
    }
    const point = clientToImage(
      clientX,
      clientY,
      stage.getBoundingClientRect(),
      layout,
      imageWidth,
      imageHeight,
    );
    if (!point) {
      return;
    }
    dragOriginRef.current = point;
    setCrop(
      clampImageCropRect(
        { sx: point.x, sy: point.y, sw: 1, sh: 1 },
        imageWidth,
        imageHeight,
      ),
    );
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const origin = dragOriginRef.current;
    const stage = stageRef.current;
    if (!origin || !stage) {
      return;
    }
    const point = clientToImage(
      clientX,
      clientY,
      stage.getBoundingClientRect(),
      layout,
      imageWidth,
      imageHeight,
    );
    if (!point) {
      return;
    }
    setCrop(
      cropRectFromCorners(
        origin.x,
        origin.y,
        point.x,
        point.y,
        imageWidth,
        imageHeight,
      ),
    );
  };

  const endDrag = () => {
    dragOriginRef.current = null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="p" variant="muted">
          Drag on the image to choose what to keep.
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            disabled={busy}
            title="Select the largest centered square"
            onClick={() => {
              setCrop(centerSquareCrop(imageWidth, imageHeight));
            }}
          >
            Square
          </Button>
          <Button
            variant="default"
            disabled={busy}
            title="Select the full image"
            onClick={() => {
              setCrop(fullImageCrop(imageWidth, imageHeight));
            }}
          >
            Restore
          </Button>
          <Button
            variant="default"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy}
            title="Crop to the selected region"
            onClick={() => {
              onApply(crop);
            }}
          >
            Apply crop
          </Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 cursor-crosshair touch-none overflow-hidden rounded-sm bg-control select-none"
        role="application"
        aria-label="Crop image"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          beginDrag(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (!dragOriginRef.current) {
            return;
          }
          moveDrag(event.clientX, event.clientY);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-h-none max-w-none"
          style={{
            left: layout.offsetX,
            top: layout.offsetY,
            width: layout.drawWidth,
            height: layout.drawHeight,
          }}
        />
        <div
          className="pointer-events-none absolute border-2 border-accent"
          style={{
            ...selectionStyle,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.45)',
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
