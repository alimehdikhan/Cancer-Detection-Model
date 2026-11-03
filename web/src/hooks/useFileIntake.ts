import { useEffect, useRef, useState } from 'react'

import { firstImage } from '@/lib/image'

const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

/**
 * Accepts an image dropped anywhere on the page or pasted from the clipboard.
 * Returns whether a file is currently being dragged over the window.
 */
export function useFileIntake(onImage: (file: File) => void, onNotImage: () => void) {
  const [dragging, setDragging] = useState(false)
  const handlers = useRef({ onImage, onNotImage })
  handlers.current = { onImage, onNotImage }

  useEffect(() => {
    let depth = 0

    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      depth += 1
      setDragging(true)
    }
    const over = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const drop = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      depth = 0
      setDragging(false)
      const image = firstImage(event.dataTransfer?.files)
      if (image) handlers.current.onImage(image)
      else handlers.current.onNotImage()
    }
    const paste = (event: ClipboardEvent) => {
      const files = event.clipboardData?.files
      if (!files || files.length === 0) return
      const image = firstImage(files)
      event.preventDefault()
      if (image) handlers.current.onImage(image)
      else handlers.current.onNotImage()
    }

    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    window.addEventListener('paste', paste)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
      window.removeEventListener('paste', paste)
    }
  }, [])

  return dragging
}
