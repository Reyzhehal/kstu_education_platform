import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import styles from "./RichTextEditor.module.css"

type RichTextEditorProps = {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  onImageUpload?: (file: File) => Promise<string>
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  editable = true,
  onImageUpload,
}: RichTextEditorProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultPlaceholder = placeholder || t("editor.placeholder")
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.link,
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: styles.image,
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: styles.table,
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: defaultPlaceholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt(t("editor.urlPrompt"), previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor, t])

  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt(t("editor.imageUrlPrompt"))

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, t])

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor || !onImageUpload) return

      if (!file.type.startsWith("image/")) {
        alert(t("editor.selectImage"))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(t("editor.fileSizeError"))
        return
      }

      try {
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch (error) {
        console.error("Error uploading image:", error)
        alert(t("editor.uploadError"))
      }
    },
    [editor, onImageUpload, t],
  )

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      await uploadImage(file)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [uploadImage],
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!onImageUpload) return

      const file = e.dataTransfer.files?.[0]
      if (file?.type.startsWith("image/")) {
        await uploadImage(file)
      }
    },
    [onImageUpload, uploadImage],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const triggerImageUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div className={styles.root}>
      {editable && (
        <div className={styles.toolbar}>
          {/* Text formatting */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? styles.isActive : ""}
              title={t("editor.bold")}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? styles.isActive : ""}
              title={t("editor.italic")}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? styles.isActive : ""}
              title={t("editor.underline")}
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? styles.isActive : ""}
              title={t("editor.strikethrough")}
            >
              <s>S</s>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? styles.isActive : ""}
              title={t("editor.code")}
            >
              {"</>"}
            </button>
          </div>

          {/* Headings */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={
                editor.isActive("heading", { level: 1 }) ? styles.isActive : ""
              }
              title={t("editor.heading1")}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={
                editor.isActive("heading", { level: 2 }) ? styles.isActive : ""
              }
              title={t("editor.heading2")}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={
                editor.isActive("heading", { level: 3 }) ? styles.isActive : ""
              }
              title={t("editor.heading3")}
            >
              H3
            </button>
          </div>

          {/* Lists */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? styles.isActive : ""}
              title={t("editor.bulletList")}
            >
              ⬤
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? styles.isActive : ""}
              title={t("editor.orderedList")}
            >
              1.
            </button>
          </div>

          {/* Alignment */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={
                editor.isActive({ textAlign: "left" }) ? styles.isActive : ""
              }
              title={t("editor.alignLeft")}
            >
              ≡
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={
                editor.isActive({ textAlign: "center" }) ? styles.isActive : ""
              }
              title={t("editor.alignCenter")}
            >
              ≣
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={
                editor.isActive({ textAlign: "right" }) ? styles.isActive : ""
              }
              title={t("editor.alignRight")}
            >
              ≡
            </button>
          </div>

          {/* Insert */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={setLink}
              className={editor.isActive("link") ? styles.isActive : ""}
              title={t("editor.insertLink")}
            >
              🔗
            </button>
            {onImageUpload ? (
              <>
                <button
                  type="button"
                  onClick={triggerImageUpload}
                  title={t("editor.uploadImage")}
                >
                  🖼
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </>
            ) : (
              <button
                type="button"
                onClick={addImage}
                title={t("editor.insertImageUrl")}
              >
                🖼
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              title={t("editor.insertTable")}
            >
              ⊞
            </button>
          </div>

          {/* Blockquote & Code block */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? styles.isActive : ""}
              title={t("editor.blockquote")}
            >
              ❝❞
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive("codeBlock") ? styles.isActive : ""}
              title={t("editor.codeBlock")}
            >
              {"{ }"}
            </button>
          </div>

          {/* Divider & Clear */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title={t("editor.horizontalRule")}
            >
              ―
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().clearNodes().unsetAllMarks().run()
              }
              title={t("editor.clearFormatting")}
            >
              ⎚
            </button>
          </div>
        </div>
      )}

      <div onDrop={handleDrop} onDragOver={handleDragOver}>
        <EditorContent editor={editor} className={styles.editor} />
      </div>
    </div>
  )
}
