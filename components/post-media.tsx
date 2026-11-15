"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PostImage } from "@/lib/types";
import { useFocusTrap } from "./focus-trap";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "./icons";

export function PostMedia({
  images,
  title,
  variant = "card",
}: {
  images: PostImage[];
  title: string;
  variant?: "card" | "detail";
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const shown = variant === "card" ? images.slice(0, 4) : images;
  const detailSingle = variant === "detail" && images.length === 1;

  if (images.length === 0) return null;

  const singleRatio = shown[0]
    ? Math.min(1.7, Math.max(0.85, shown[0].width / shown[0].height))
    : 4 / 3;

  const sizes =
    variant === "card"
      ? images.length === 1
        ? "(max-width: 720px) 100vw, 640px"
        : "(max-width: 720px) 50vw, 320px"
      : "(max-width: 900px) 100vw, 460px";

  return (
    <>
      {detailSingle ? (
        <div
          className="post-media post-media--detail post-media--single"
          style={
            {
              "--single-aspect": String(images[0].width / images[0].height),
            } as CSSProperties
          }
        >
          <button
            type="button"
            className="media-single-button"
            onClick={() => setLightbox(0)}
            aria-label={`查看大图：${images[0].alt}`}
          >
            <Image
              src={images[0].url}
              alt={images[0].alt}
              width={images[0].width}
              height={images[0].height}
              sizes="(max-width: 900px) 100vw, 920px"
              loading="eager"
              unoptimized={images[0].url.startsWith("/api/media?")}
              fetchPriority="high"
              className="media-single-image"
            />
            <span className="media-zoom-hint">点击看大图</span>
          </button>
        </div>
      ) : (
        <div
          className={`post-media post-media--${variant} post-media--count-${shown.length}`}
          style={{ "--media-ratio": String(singleRatio) } as CSSProperties}
        >
          {shown.map((image, index) => {
            const tall = image.height > image.width * 1.15;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                className="media-cell"
                onClick={() => setLightbox(index)}
                aria-label={`查看配图 ${index + 1}：${image.alt}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes={sizes}
                  loading={variant === "detail" && index === 0 ? "eager" : "lazy"}
                  fetchPriority={variant === "detail" && index === 0 ? "high" : "auto"}
                  unoptimized={image.url.startsWith("/api/media?")}
                  className="media-image"
                  style={{ objectPosition: tall ? "50% 20%" : "50% 50%" }}
                />
                {index === 3 && images.length > 4 ? (
                  <span className="media-more">+{images.length - 4}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {lightbox !== null ? (
        <Lightbox
          images={images}
          index={lightbox}
          title={title}
          onClose={() => setLightbox(null)}
          onChange={setLightbox}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  images,
  index,
  title,
  onClose,
  onChange,
}: {
  images: PostImage[];
  index: number;
  title: string;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, dialogRef);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        onChange((index - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        onChange((index + 1) % images.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, images.length, onClose, onChange]);

  const image = images[index];
  if (!image) return null;

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}的配图`}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="关闭大图"
      >
        <CloseIcon size={20} />
      </button>

      <div className="lightbox__stage" onClick={(event) => event.stopPropagation()}>
        <Image
          key={image.url}
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="92vw"
          unoptimized={image.url.startsWith("/api/media?")}
          className="lightbox__image"
        />
      </div>

      <div className="lightbox__meta" onClick={(event) => event.stopPropagation()}>
        <p className="lightbox__caption">{image.alt}</p>
        <span className="lightbox__counter">
          {index + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={(event) => {
              event.stopPropagation();
              onChange((index - 1 + images.length) % images.length);
            }}
            aria-label="上一张"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={(event) => {
              event.stopPropagation();
              onChange((index + 1) % images.length);
            }}
            aria-label="下一张"
          >
            <ArrowRightIcon size={20} />
          </button>
        </>
      ) : null}
    </div>
  );
}
