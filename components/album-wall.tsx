"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { deleteAlbumImage } from "@/lib/album-actions";
import { uploadAlbumImages, type AlbumUploadedImage } from "@/lib/upload";
import { toast } from "@/lib/toast";
import { useFocusTrap } from "./focus-trap";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, ImageIcon, TrashIcon, UploadIcon } from "./icons";

export type AlbumWallImage = AlbumUploadedImage;

export function AlbumWall({ initialImages }: { initialImages: AlbumWallImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [selected, setSelected] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]) {
    if (!files.length || uploading) return;
    setUploading(true);
    setProgress(2);
    try {
      const uploaded = await uploadAlbumImages(files, setProgress);
      setImages((current) => [...uploaded, ...current]);
      toast(`收好了 ${uploaded.length} 张相册照片`, "success");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast(error instanceof Error ? error.message : "相册照片上传失败", "error");
      }
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="album-wall" aria-label="私密相册照片">
      <div className="album-wall__toolbar">
        <div>
          <span className="mini-label">PRIVATE ARCHIVE · 私密收藏</span>
          <p className="album-wall__count">{images.length} 张照片，只对登录后的你可见</p>
        </div>
        <label className={`button button--primary album-upload${uploading ? " is-busy" : ""}`}>
          <UploadIcon size={16} />
          <span>{uploading ? `正在收好 ${progress}%` : "放入照片"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={(event) => void handleFiles(Array.from(event.target.files ?? []))}
          />
        </label>
      </div>

      {uploading ? (
        <div className="album-progress" role="status">
          <span style={{ width: `${progress}%` }} />
          <small>照片会先在浏览器里缩放，再直传到私有 B2 桶；单张不超过 20MB。</small>
        </div>
      ) : null}

      {images.length === 0 ? (
        <div className="album-empty">
          <span className="album-empty__icon"><ImageIcon size={28} /></span>
          <h2>还没有照片</h2>
          <p>把生活里想留住的光，放进这个只属于你的角落。</p>
        </div>
      ) : (
        <div className="album-grid">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="album-tile"
              style={{ backgroundColor: image.accent }}
              onClick={() => setSelected(index)}
              aria-label={`查看相册照片 ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt || image.caption || "生活照片"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
                loading="lazy"
                className="album-tile__image"
              />
              {image.caption ? <span className="album-tile__caption">{image.caption}</span> : null}
            </button>
          ))}
        </div>
      )}

      {selected !== null && images[selected] ? (
        <AlbumLightbox
          images={images}
          index={selected}
          onClose={() => setSelected(null)}
          onChange={setSelected}
          onDeleted={(id) => {
            setImages((current) => current.filter((image) => image.id !== id));
            setSelected(null);
          }}
        />
      ) : null}
    </section>
  );
}

function AlbumLightbox({
  images,
  index,
  onClose,
  onChange,
  onDeleted,
}: {
  images: AlbumWallImage[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
  onDeleted: (id: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);
  useFocusTrap(true, dialogRef);
  const image = images[index];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") onChange((index + 1) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, index, onChange, onClose]);

  if (!image) return null;

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    const result = await deleteAlbumImage(image.id);
    if (result.ok) {
      toast("照片已从私密相册移除", "success");
      onDeleted(image.id);
    } else {
      toast(result.error, "error");
      setDeleting(false);
    }
  }

  return (
    <div ref={dialogRef} className="album-lightbox" role="dialog" aria-modal="true" aria-label="相册照片预览" onClick={onClose}>
      <button type="button" className="album-lightbox__close" onClick={onClose} aria-label="关闭预览"><CloseIcon size={20} /></button>
      <div className="album-lightbox__stage" onClick={(event) => event.stopPropagation()}>
        <Image key={image.url} src={image.url} alt={image.alt || image.caption || "生活照片"} width={image.width} height={image.height} sizes="92vw" className="album-lightbox__image" />
      </div>
      <div className="album-lightbox__meta" onClick={(event) => event.stopPropagation()}>
        <div>
          <p>{image.caption || image.alt || "生活照片"}</p>
          <small>{index + 1} / {images.length} · {(image.bytes / 1024 / 1024).toFixed(1)} MB</small>
        </div>
        <button type="button" className="album-lightbox__delete" onClick={() => void remove()} disabled={deleting}>
          <TrashIcon size={15} />
          {deleting ? "移除中" : "移除"}
        </button>
      </div>
      {images.length > 1 ? <>
        <button type="button" className="album-lightbox__nav album-lightbox__nav--prev" onClick={(event) => { event.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} aria-label="上一张"><ArrowLeftIcon size={20} /></button>
        <button type="button" className="album-lightbox__nav album-lightbox__nav--next" onClick={(event) => { event.stopPropagation(); onChange((index + 1) % images.length); }} aria-label="下一张"><ArrowRightIcon size={20} /></button>
      </> : null}
    </div>
  );
}
