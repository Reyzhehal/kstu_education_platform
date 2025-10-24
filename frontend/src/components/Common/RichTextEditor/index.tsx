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
  placeholder = "Начните писать...",
  editable = true,
  onImageUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        placeholder,
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
    const url = window.prompt("URL:", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt("URL изображения:")

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor || !onImageUpload) return

      // Проверяем тип файла
      if (!file.type.startsWith("image/")) {
        alert("Пожалуйста, выберите изображение")
        return
      }

      // Проверяем размер файла (5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        alert("Размер файла не должен превышать 5 МБ")
        return
      }

      try {
        // Загружаем изображение через callback
        const url = await onImageUpload(file)
        // Вставляем изображение в редактор
        editor.chain().focus().setImage({ src: url }).run()
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Ошибка при загрузке изображения")
      }
    },
    [editor, onImageUpload],
  )

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      await uploadImage(file)

      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [uploadImage],
  )

  // Поддержка drag & drop для изображений
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
              title="Жирный"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? styles.isActive : ""}
              title="Курсив"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? styles.isActive : ""}
              title="Подчеркнутый"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? styles.isActive : ""}
              title="Зачеркнутый"
            >
              <s>S</s>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? styles.isActive : ""}
              title="Код"
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
              title="Заголовок 1"
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
              title="Заголовок 2"
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
              title="Заголовок 3"
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
              title="Маркированный список"
            >
              ⬤
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? styles.isActive : ""}
              title="Нумерованный список"
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
              title="Выровнять по левому краю"
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
              title="Выровнять по центру"
            >
              ≣
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={
                editor.isActive({ textAlign: "right" }) ? styles.isActive : ""
              }
              title="Выровнять по правому краю"
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
              title="Вставить ссылку"
            >
              🔗
            </button>
            {onImageUpload ? (
              <>
                <button
                  type="button"
                  onClick={triggerImageUpload}
                  title="Загрузить изображение"
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
                title="Вставить изображение по URL"
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
              title="Вставить таблицу"
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
              title="Цитата"
            >
              ❝❞
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive("codeBlock") ? styles.isActive : ""}
              title="Блок кода"
            >
              {"{ }"}
            </button>
          </div>

          {/* Divider & Clear */}
          <div className={styles.group}>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Горизонтальная линия"
            >
              ―
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().clearNodes().unsetAllMarks().run()
              }
              title="Очистить форматирование"
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
