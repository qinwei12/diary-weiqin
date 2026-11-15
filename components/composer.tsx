"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { savePost } from "@/lib/actions";
import {
  fromDateTimeInputValue,
  readingMinutes,
  toDateTimeInputValue,
  wordCount,
} from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { MOODS, WEATHERS } from "@/lib/site";
import { toast } from "@/lib/toast";
import type { Post } from "@/lib/types";
import {
  toComposerImage,
  uploadImages,
  type ComposerImage,
} from "@/lib/upload";
import { useFocusTrap } from "./focus-trap";
import {
  ArrowLeftIcon,
  CloseIcon,
  ImageIcon,
  LinkIcon,
  SparkIcon,
  UploadIcon,
} from "./icons";

const DRAFT_KEY = "orange-isle:compose-draft";

type Mode = "edit" | "preview" | "split";

type FormState = {
  title: string;
  content: string;
  tagsText: string;
  mood: string;
  weather: string;
  location: string;
  createdAt: string;
  pinned: boolean;
};

type StoredDraft = FormState & {
  images?: unknown;
  savedAt?: number;
};

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formFromPost(post: Post): FormState {
  return {
    title: post.title,
    content: post.content,
    tagsText: post.tags.join(" "),
    mood: post.mood,
    weather: post.weather,
    location: post.location,
    createdAt: toDateTimeInputValue(post.createdAt),
    pinned: post.pinned,
  };
}

function emptyForm(): FormState {
  return {
    title: "",
    content: "",
    tagsText: "",
    mood: "🌿",
    weather: "晴",
    location: "",
    createdAt: "",
    pinned: false,
  };
}

function parseTags(text: string): string[] {
  const tags = new Set<string>();
  for (const part of text.split(/[\s,，#]+/)) {
    const tag = part.trim().slice(0, 16);
    if (tag) tags.add(tag);
    if (tags.size >= 8) break;
  }
  return [...tags];
}

function isStoredImage(value: unknown): value is ComposerImage {
  if (!value || typeof value !== "object") return false;
  const image = value as Partial<ComposerImage>;
  return (
    typeof image.url === "string" &&
    image.url.startsWith("/") &&
    typeof image.width === "number" &&
    typeof image.height === "number" &&
    Array.isArray(image.palette) &&
    image.palette.every((color) => typeof color === "string")
  );
}

function readDraft(): { form: FormState; images: ComposerImage[] } | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredDraft>;
    const text = (value: unknown) =>
      typeof value === "string" ? value : "";
    const form: FormState = {
      title: text(data.title),
      content: text(data.content),
      tagsText: text(data.tagsText),
      mood: text(data.mood) || "🌿",
      weather: text(data.weather) || "晴",
      location: text(data.location),
      createdAt: text(data.createdAt),
      pinned: Boolean(data.pinned),
    };
    const images = Array.isArray(data.images)
      ? data.images
          .filter(isStoredImage)
          .map((image) => ({
            ...image,
            alt: typeof image.alt === "string" ? image.alt : "",
            localId: image.localId || randomId(),
          }))
      : [];
    if (!form.title && !form.content && images.length === 0) return null;
    return { form, images };
  } catch {
    return null;
  }
}

export function Composer({
  post,
  tagSuggestions,
  mustChangePassword = false,
}: {
  post: Post | null;
  tagSuggestions: string[];
  mustChangePassword?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(post);
  const [form, setForm] = useState<FormState>(() =>
    post ? formFromPost(post) : emptyForm(),
  );
  const [images, setImages] = useState<ComposerImage[]>(() =>
    post
      ? post.images.map((image) => ({ ...image, localId: randomId() }))
      : [],
  );
  const [mode, setMode] = useState<Mode>("edit");
  const [uploading, setUploading] = useState<{
    count: number;
    percent: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [imagePicker, setImagePicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageToolRef = useRef<HTMLDivElement>(null);
  const autosaveGate = useRef(false);
  const publishingRef = useRef(false);
  const uploadGate = useRef(false);
  const leaveDialogRef = useRef<HTMLDivElement>(null);

  const tags = useMemo(() => parseTags(form.tagsText), [form.tagsText]);
  const cover = images[0];
  const words = wordCount(form.content);
  const minutes = words === 0 ? 0 : readingMinutes(form.content);
  const canPublish = !saving && !uploading;

  // Draft restoration is intentionally post-hydration: localStorage is not
  // available while this component is server rendered.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEdit) return;
    const draft = readDraft();
    if (draft) {
      setForm(draft.form);
      setImages(draft.images);
      setDraftRestored(true);
      setDraftSaved(true);
      setDirty(true);
      return;
    }
    setForm((current) => ({
      ...current,
      createdAt: toDateTimeInputValue(),
    }));
  }, [isEdit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isEdit) return;
    if (!autosaveGate.current) {
      autosaveGate.current = true;
      return;
    }
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...form, images, savedAt: Date.now() }),
        );
        setDraftSaved(true);
      } catch {
        // Autosave is a convenience; publishing still works without it.
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [form, images, dirty, isEdit]);

  useEffect(() => {
    if (mode === "preview") return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(360, textarea.scrollHeight)}px`;
  }, [form.content, mode]);

  useEffect(() => {
    if (!dirty || !isEdit) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, isEdit]);

  useEffect(() => {
    if (!imagePicker) return;
    function onPointerDown(event: PointerEvent) {
      if (!imageToolRef.current?.contains(event.target as Node)) {
        setImagePicker(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [imagePicker]);

  useEffect(() => {
    if (!leaveOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLeaveOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [leaveOpen]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setError(null);
  }

  function focusAt(start: number, end = start) {
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  }

  function replaceRange(start: number, end: number, text: string) {
    const next = form.content.slice(0, start) + text + form.content.slice(end);
    update("content", next);
    focusAt(start + text.length);
  }

  function wrap(before: string, after: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const next =
      form.content.slice(0, start) +
      before +
      selected +
      after +
      form.content.slice(end);
    update("content", next);
    focusAt(start + before.length, start + before.length + selected.length);
  }

  function prefixLine(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = form.content.lastIndexOf("\n", start - 1) + 1;
    const next =
      form.content.slice(0, lineStart) +
      prefix +
      form.content.slice(lineStart);
    update("content", next);
    focusAt(start + prefix.length);
  }

  function insertText(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      update("content", `${form.content}${text}`);
      return;
    }
    replaceRange(textarea.selectionStart, textarea.selectionEnd, text);
  }

  function insertImage(image: ComposerImage) {
    insertText(
      `![${image.alt || form.title.trim() || "日记配图"}](${image.url})\n`,
    );
    setImagePicker(false);
  }

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (list.length === 0) {
      toast("只支持图片文件", "error");
      return;
    }
    if (uploadGate.current || uploading) {
      toast("上一批图片还在上传，稍等一下", "error");
      return;
    }
    const remaining = 9 - images.length;
    if (remaining <= 0) {
      toast("一篇日记最多放 9 张图片", "error");
      return;
    }
    const selected = list.slice(0, remaining);
    if (list.length > remaining) {
      toast(`最多 9 张，先放前 ${remaining} 张`, "error");
    }

    uploadGate.current = true;
    setUploading({ count: selected.length, percent: 0 });
    try {
      const uploaded = await uploadImages(selected, (percent) =>
        setUploading({ count: selected.length, percent }),
      );
      setImages((current) => [
        ...current,
        ...uploaded.map((image) => toComposerImage(image)),
      ]);
      setDirty(true);
      toast(`收好了 ${uploaded.length} 张照片`, "success");
    } catch (uploadError) {
      toast(
        uploadError instanceof Error ? uploadError.message : "图片上传失败",
        "error",
      );
    } finally {
      uploadGate.current = false;
      setUploading(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  }

  function makeCover(index: number) {
    setImages((current) => {
      if (index === 0) return current;
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
    setDirty(true);
    toast("已设为封面");
  }

  function removeImage(localId: string) {
    setImages((current) => current.filter((image) => image.localId !== localId));
    setDirty(true);
  }

  function updateImageAlt(localId: string, alt: string) {
    setImages((current) =>
      current.map((image) =>
        image.localId === localId ? { ...image, alt: alt.slice(0, 120) } : image,
      ),
    );
    setDirty(true);
  }

  function toggleTag(tag: string) {
    const current = parseTags(form.tagsText);
    const next = current.includes(tag)
      ? current.filter((item) => item !== tag)
      : [...current, tag].slice(0, 8);
    update("tagsText", next.join(" "));
  }

  function saveDraftNow(silent = false) {
    if (isEdit) return;
    if (!form.title && !form.content && images.length === 0) {
      if (!silent) toast("还没有内容可以存成草稿", "error");
      return;
    }
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form, images, savedAt: Date.now() }),
      );
      setDraftSaved(true);
      if (!silent) toast("草稿已保存在这台设备上", "success");
    } catch {
      if (!silent) toast("浏览器不允许保存草稿", "error");
    }
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore storage failures.
    }
    setForm({ ...emptyForm(), createdAt: toDateTimeInputValue() });
    setImages([]);
    setDraftRestored(false);
    setDraftSaved(false);
    setDirty(false);
    setError(null);
    toast("草稿已丢弃");
  }

  function requestLeave() {
    if (dirty) {
      setLeaveOpen(true);
      return;
    }
    router.push("/");
  }

  function leavePage() {
    if (!isEdit) saveDraftNow(true);
    setLeaveOpen(false);
    setDirty(false);
    router.push("/");
  }

  async function publish() {
    if (publishingRef.current) return;
    if (uploading) {
      toast("图片还在上传，等它们落稳", "error");
      return;
    }
    if (!form.title.trim() && !form.content.trim() && images.length === 0) {
      toast("先写点什么，或者放一张照片吧", "error");
      setError("这一页还是空的，写一句也算数。");
      return;
    }

    publishingRef.current = true;
    setSaving(true);
    setError(null);

    const result = await savePost({
      id: post?.id,
      title: form.title,
      content: form.content,
      images: images.map((image) => ({
        url: image.url,
        alt: image.alt || `${form.title || "日记"}的配图`,
        width: image.width,
        height: image.height,
        palette: image.palette,
      })),
      tags,
      mood: form.mood,
      weather: form.weather,
      location: form.location,
      createdAt: fromDateTimeInputValue(form.createdAt),
      pinned: form.pinned,
    });

    if (!result.ok) {
      publishingRef.current = false;
      setSaving(false);
      setError(result.error);
      toast(result.error, "error");
      return;
    }

    if (!isEdit) {
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore storage failures.
      }
    }
    setDirty(false);
    setDraftSaved(false);
    toast(isEdit ? "这一页已经更新" : "日记已经收好", "success");
    router.push(`/posts/${result.id}`);
    router.refresh();
  }

  function handlePageKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void publish();
    }
  }

  useFocusTrap(leaveOpen, leaveDialogRef);

  const statusText = isEdit
    ? "正在编辑一篇旧日记"
    : draftSaved
      ? "草稿已自动保存在本机"
      : "新的一页，慢慢写";

  return (
    <div className="compose-page" onKeyDown={handlePageKeyDown}>
      <div className="compose-topbar">
        <div className="container compose-topbar__inner">
          <button type="button" className="compose-back" onClick={requestLeave}>
            <ArrowLeftIcon size={15} />
            返回
          </button>
          <span className="compose-status">
            <span
              className={`compose-status__dot${draftSaved && !isEdit ? " is-saved" : ""}`}
              aria-hidden="true"
            />
            {statusText}
          </span>
          <div className="compose-topbar__actions">
            {!isEdit ? (
              <button
                type="button"
                className="button button--quiet button--small compose-save-draft"
                onClick={() => saveDraftNow()}
              >
                存草稿
              </button>
            ) : null}
            <button
              type="button"
              className="button button--primary button--small"
              onClick={() => void publish()}
              disabled={!canPublish}
            >
              {saving ? "正在保存…" : isEdit ? "更新日记" : "发布日记"}
            </button>
          </div>
        </div>
      </div>

      <div className="container compose-layout">
        <main className="compose-main">
          {mustChangePassword ? (
            <div className="compose-security">
              <SparkIcon size={15} />
              <span>你还在使用初始密码，建议先去「账户」改掉。</span>
              <Link href="/account">去修改</Link>
            </div>
          ) : null}

          {draftRestored ? (
            <div className="draft-banner">
              <span>
                <SparkIcon size={15} />
                已恢复上次没写完的草稿
              </span>
              <button type="button" onClick={discardDraft}>
                丢弃
              </button>
            </div>
          ) : null}

          <div className="compose-title-block">
            <span className="mini-label">
              {isEdit ? "EDITING A PAGE" : "A NEW PAGE"}
            </span>
            <input
              className="compose-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="给今天起一个标题…"
              aria-label="日记标题"
              maxLength={120}
            />
            <p className="compose-title-note">
              标题可以空着，日期和心情也会替这一页说话。
            </p>
          </div>

          <section className={`editor-card mode-${mode}`}>
            <div className="editor-top">
              <div className="editor-tabs" role="tablist" aria-label="编辑模式">
                {(
                  [
                    ["edit", "编写"],
                    ["preview", "预览"],
                    ["split", "并排"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    className={`editor-tab${mode === value ? " is-active" : ""}${
                      value === "split" ? " editor-tab--split" : ""
                    }`}
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="editor-top__count">
                {words} 字 · {minutes} 分钟阅读
              </span>
            </div>

            {mode !== "preview" ? (
              <div className="editor-toolbar" role="toolbar" aria-label="Markdown 工具">
                <button type="button" onClick={() => prefixLine("## ")} title="二级标题">
                  H2
                </button>
                <button type="button" onClick={() => wrap("**", "**", "加粗文字")} title="加粗">
                  <strong>B</strong>
                </button>
                <button type="button" onClick={() => wrap("_", "_", "斜体文字")} title="斜体">
                  <em>I</em>
                </button>
                <span className="editor-toolbar__divider" aria-hidden="true" />
                <button type="button" onClick={() => prefixLine("> ")} title="引用">
                  “”
                </button>
                <button type="button" onClick={() => prefixLine("- ")} title="无序列表">
                  • 列表
                </button>
                <button type="button" onClick={() => prefixLine("1. ")} title="有序列表">
                  1. 列表
                </button>
                <button type="button" onClick={() => wrap("`", "`", "代码")} title="行内代码">
                  {"</>"}
                </button>
                <button
                  type="button"
                  onClick={() => wrap("[", "](https://)", "链接文字")}
                  title="链接"
                >
                  <LinkIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertText("\n\n---\n\n")}
                  title="分隔线"
                >
                  —
                </button>
                <span className="editor-toolbar__spacer" />
                <div className="editor-image-tool" ref={imageToolRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (images.length === 0) {
                        toast("先在下面加一张配图吧", "error");
                        return;
                      }
                      setImagePicker((open) => !open);
                    }}
                    title="插入已上传的配图"
                  >
                    <ImageIcon size={14} />
                    配图
                  </button>
                  {imagePicker && images.length > 0 ? (
                    <div className="image-picker" role="menu">
                      <p>选一张插入正文</p>
                      <div className="image-picker__grid">
                        {images.map((image) => (
                          <button
                            key={image.localId}
                            type="button"
                            onClick={() => insertImage(image)}
                            aria-label="插入这张配图"
                          >
                            <Image
                              src={image.url}
                              alt={image.alt || "配图"}
                              width={image.width}
                              height={image.height}
                              sizes="80px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className={`editor-body editor-body--${mode}`}>
              {mode !== "preview" ? (
                <textarea
                  ref={textareaRef}
                  className="editor-textarea"
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  onPaste={(event) => {
                    const pasted = Array.from(event.clipboardData.files).filter(
                      (file) => file.type.startsWith("image/"),
                    );
                    if (pasted.length > 0) {
                      event.preventDefault();
                      void addFiles(pasted);
                    }
                  }}
                  onKeyDown={(event) => {
                    const modifier = event.metaKey || event.ctrlKey;
                    if (modifier && event.key.toLowerCase() === "b") {
                      event.preventDefault();
                      wrap("**", "**", "加粗文字");
                    }
                    if (modifier && event.key.toLowerCase() === "i") {
                      event.preventDefault();
                      wrap("_", "_", "斜体文字");
                    }
                  }}
                  placeholder={
                    "今天想记下什么？\n\n可以写 Markdown：## 小标题、> 引用、- 列表、**加粗**…\n也可以直接把图片粘贴到这里。"
                  }
                  aria-label="日记正文"
                  spellCheck={false}
                />
              ) : null}

              {mode !== "edit" ? (
                <div className="editor-preview">
                  {form.content.trim() ? (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(form.content),
                      }}
                    />
                  ) : (
                    <p className="editor-preview__empty">
                      这里会显示发布后的样子。先去左边写一点吧。
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="editor-foot">
              <span>支持 Markdown · 图片可直接粘贴</span>
              <span>⌘ / Ctrl + Enter 发布</span>
            </div>
          </section>

          <section className="composer-block composer-media">
            <header className="composer-block__head">
              <div>
                <h2>配图</h2>
                <p>第一张会成为封面，页面会从它身上自动取色。</p>
              </div>
              <span className="composer-block__meta">{images.length} / 9</span>
            </header>

            <div
              className={`media-dropzone${dragOver ? " is-drag" : ""}${
                uploading ? " is-busy" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files) void addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <span className="media-dropzone__icon">
                <UploadIcon size={20} />
              </span>
              <div>
                <p>
                  拖进照片，或{" "}
                  <span className="media-dropzone__link">选择图片</span>
                </p>
                <small>JPG、PNG、WebP、AVIF · 单张不超过 20MB</small>
              </div>
            </div>

            {images.length > 0 || uploading ? (
              <div className="composer-images">
                {images.map((image, index) => (
                  <figure
                    className={`composer-image${index === 0 ? " is-cover" : ""}`}
                    key={image.localId}
                  >
                    <div className="composer-image__media">
                      <Image
                        src={image.url}
                        alt={image.alt || `配图 ${index + 1}`}
                        fill
                        sizes="(max-width: 720px) 40vw, 190px"
                      />
                    </div>
                    {index === 0 ? (
                      <span className="composer-image__cover">封面</span>
                    ) : null}
                    <span className="composer-image__palette" aria-hidden="true">
                      {image.palette.slice(0, 4).map((color, colorIndex) => (
                        <span
                          key={`${color}-${colorIndex}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                    <figcaption>
                      {index === 0 ? (
                        <span className="composer-image__hint">取色来源</span>
                      ) : (
                        <button
                          type="button"
                          className="composer-image__cover-btn"
                          onClick={() => makeCover(index)}
                        >
                          设为封面
                        </button>
                      )}
                      <button
                        type="button"
                        className="composer-image__remove"
                        onClick={() => removeImage(image.localId)}
                        aria-label={`移除配图 ${index + 1}`}
                      >
                        <CloseIcon size={13} />
                      </button>
                    </figcaption>
                  </figure>
                ))}

                {uploading ? (
                  <div className="composer-image composer-image--uploading">
                    <span>{uploading.percent}%</span>
                    <small>正在处理 {uploading.count} 张图片</small>
                    <span className="composer-image__bar">
                      <span style={{ width: `${uploading.percent}%` }} />
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {images.length > 0 ? (
              <div className="composer-alt">
                <div className="composer-alt__head">
                  <span>图片说明</span>
                  <small>写给读屏软件，也写给以后忘记当时场景的自己</small>
                </div>
                {images.map((image, index) => (
                  <label className="composer-alt__row" key={image.localId}>
                    <Image
                      src={image.url}
                      alt=""
                      width={image.width}
                      height={image.height}
                      sizes="42px"
                    />
                    <span>
                      配图 {index + 1}
                      {index === 0 ? " · 封面" : ""}
                    </span>
                    <input
                      value={image.alt}
                      onChange={(event) =>
                        updateImageAlt(image.localId, event.target.value)
                      }
                      placeholder="例如：窗边的落日和一杯热茶"
                      maxLength={120}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="compose-aside" aria-label="发布设置">
          <section className="composer-card">
            <header className="composer-card__head">
              <h2>这一页的信息</h2>
              <span>DETAILS</span>
            </header>

            <label className="compose-field">
              <span>时间</span>
              <input
                type="datetime-local"
                value={form.createdAt}
                onChange={(event) => update("createdAt", event.target.value)}
              />
            </label>

            <label className="compose-field">
              <span>天气</span>
              <input
                value={form.weather}
                onChange={(event) => update("weather", event.target.value)}
                placeholder="晴 18°"
                list="compose-weather-options"
                maxLength={24}
              />
              <datalist id="compose-weather-options">
                {WEATHERS.map((weather) => (
                  <option key={weather} value={weather} />
                ))}
              </datalist>
            </label>

            <label className="compose-field">
              <span>地点</span>
              <input
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="窗边 / 家 / 某条街"
                maxLength={40}
              />
            </label>

            <div className="compose-field">
              <span>心情</span>
              <div className="mood-picker" role="group" aria-label="选择心情">
                {MOODS.map((mood) => (
                  <button
                    key={mood.emoji}
                    type="button"
                    className={form.mood === mood.emoji ? "is-active" : ""}
                    onClick={() => update("mood", mood.emoji)}
                    aria-pressed={form.mood === mood.emoji}
                    title={mood.label}
                  >
                    <span aria-hidden="true">{mood.emoji}</span>
                    <small>{mood.label}</small>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`compose-switch${form.pinned ? " is-on" : ""}`}
              role="switch"
              aria-checked={form.pinned}
              onClick={() => update("pinned", !form.pinned)}
            >
              <span>
                <strong>置顶这一篇</strong>
                <small>会在动态流里获得一枚小徽章</small>
              </span>
              <span className="compose-switch__track" aria-hidden="true">
                <span />
              </span>
            </button>
          </section>

          <section className="composer-card">
            <header className="composer-card__head">
              <h2>标签</h2>
              <span>{tags.length} / 8</span>
            </header>
            <label className="compose-field">
              <span>用空格分隔</span>
              <input
                value={form.tagsText}
                onChange={(event) => update("tagsText", event.target.value)}
                placeholder="日常 秋天 碎碎念"
              />
            </label>

            {tags.length > 0 ? (
              <div className="compose-tag-preview">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    title={`移除 #${tag}`}
                  >
                    #{tag}
                    <CloseIcon size={11} />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="tag-suggestions">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={tags.includes(tag) ? "is-on" : ""}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <section className="composer-card composer-theme">
            <header className="composer-card__head">
              <h2>这一页的颜色</h2>
              <span>FROM PHOTO</span>
            </header>
            {cover ? (
              <>
                <div className="composer-theme__cover">
                  <Image
                    src={cover.url}
                    alt={cover.alt || "封面配图"}
                    width={cover.width}
                    height={cover.height}
                    sizes="240px"
                  />
                  <span
                    className="composer-theme__accent"
                    style={{ backgroundColor: cover.accent }}
                  />
                </div>
                <div className="composer-theme__swatches" aria-hidden="true">
                  {cover.palette.slice(0, 6).map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p>
                  主色 <code>{cover.accent.toUpperCase()}</code>{" "}
                  会用在标题、按钮和这一页的光影里。
                </p>
              </>
            ) : (
              <p className="composer-theme__empty">
                加一张照片，这里会自动出现从画面里提取的色板。
              </p>
            )}
          </section>

          <div className="compose-submit">
            <button
              type="button"
              className="button button--primary compose-submit__main"
              onClick={() => void publish()}
              disabled={!canPublish}
            >
              {saving ? "正在保存…" : isEdit ? "保存修改" : "发布这篇日记"}
            </button>
            {!isEdit ? (
              <button
                type="button"
                className="button button--quiet"
                onClick={() => saveDraftNow()}
              >
                存为草稿
              </button>
            ) : null}
            <p className={error ? "is-error" : undefined}>
              {error ?? "发布后仍可随时回来修改。"}
            </p>
          </div>
        </aside>
      </div>

      {leaveOpen ? (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-title"
          onClick={() => setLeaveOpen(false)}
        >
          <div
            ref={leaveDialogRef}
            className="confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="mini-label">BEFORE YOU GO</span>
            <h2 id="leave-title">这一页还没写完</h2>
            <p>
              {isEdit
                ? "离开后，这次的修改不会保存。"
                : "离开后，这篇会作为草稿留在这台设备上。"}
            </p>
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="button button--quiet button--small"
                onClick={() => setLeaveOpen(false)}
              >
                继续写
              </button>
              <button
                type="button"
                className="button button--primary button--small"
                onClick={leavePage}
              >
                离开
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
